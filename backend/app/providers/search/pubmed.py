from __future__ import annotations

import asyncio
import logging
import random
from time import monotonic, perf_counter
from xml.etree import ElementTree as ET

import httpx

from app.providers.search.base import SearchProviderResult
from app.providers.search.pubmed_models import (
    ESearchResponse,
    PubMedArticle,
    PubMedArticleId,
    PubMedAuthor,
)
from app.schemas.search import ProviderError, ProviderReport, SearchRequest, SearchResultItem

ESEARCH_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
ESUMMARY_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
EFETCH_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

PUBMED_ABSTRACT_NS = {
    "ns": "https://www.ncbi.nlm.nih.gov/JATS1",
}


class PubMedSearchProvider:
    source_name = "pubmed"

    def __init__(
        self,
        http_client: httpx.AsyncClient,
        api_key: str | None,
        max_results_per_request: int,
        retry_attempts: int,
        retry_backoff_seconds: float,
        retry_jitter_seconds: float,
        request_timeout_seconds: float,
        total_budget_seconds: float,
        min_interval_seconds: float,
    ) -> None:
        self.http_client = http_client
        self.api_key = api_key.strip() if api_key else None
        self.max_results_per_request = max_results_per_request
        self.retry_attempts = max(1, retry_attempts)
        self.retry_backoff_seconds = max(0.0, retry_backoff_seconds)
        self.retry_jitter_seconds = max(0.0, retry_jitter_seconds)
        self.request_timeout_seconds = request_timeout_seconds
        self.total_budget_seconds = total_budget_seconds
        self.min_interval_seconds = max(0.0, min_interval_seconds)
        self.logger = logging.getLogger("researchmind.providers.pubmed")
        self._rate_limit_lock = asyncio.Lock()
        self._last_request_started_at = 0.0

    async def search(self, payload: SearchRequest) -> SearchProviderResult:
        started_at = perf_counter()
        requested_limit = min(payload.limit, self.max_results_per_request)
        retstart = max(0, (payload.page - 1) * requested_limit)
        errors: list[ProviderError] = []
        items: list[SearchResultItem] = []
        total_results: int | None = None
        next_page: int | None = None

        try:
            async with asyncio.timeout(self.total_budget_seconds):
                # Step 1 — ESearch: get PMID list
                pmids, total_results, search_errors = await self._esearch(
                    query=payload.query,
                    retmax=requested_limit,
                    retstart=retstart,
                )
                errors.extend(search_errors)

                if pmids:
                    if total_results is not None and retstart + len(pmids) < total_results:
                        next_page = payload.page + 1

                    # Step 2 — ESummary: fetch metadata for PMIDs
                    articles, summary_errors = await self._esummary(pmids)
                    errors.extend(summary_errors)

                    # Step 3 — EFetch abstracts (best-effort, one call for all PMIDs)
                    abstracts, fetch_errors = await self._efetch_abstracts(pmids)
                    errors.extend(fetch_errors)

                    for article in articles:
                        if article.abstract is None:
                            article.abstract = abstracts.get(article.uid)

                    items = [self._normalize(article) for article in articles]

        except TimeoutError:
            errors.append(
                ProviderError(
                    code="budget_exceeded",
                    message="PubMed provider exceeded the total request budget.",
                    retryable=True,
                )
            )
            self.logger.warning("PubMed provider budget exceeded")

        status: str = "ok"
        if errors and items:
            status = "partial"
        elif errors:
            status = "error"

        return SearchProviderResult(
            items=items,
            report=ProviderReport(
                source=self.source_name,
                status=status,
                query_strategy="esearch_esummary_efetch",
                page=payload.page,
                requested_limit=requested_limit,
                served_count=len(items),
                total_results=total_results,
                next_page=next_page,
                latency_ms=round((perf_counter() - started_at) * 1000, 2),
                errors=errors,
            ),
        )

    async def _esearch(
        self,
        *,
        query: str,
        retmax: int,
        retstart: int,
    ) -> tuple[list[str], int | None, list[ProviderError]]:
        params: dict[str, str | int] = {
            "db": "pubmed",
            "term": query,
            "retmax": retmax,
            "retstart": retstart,
            "retmode": "json",
            "sort": "relevance",
        }
        if self.api_key:
            params["api_key"] = self.api_key

        for attempt in range(1, self.retry_attempts + 1):
            await self._respect_min_interval()
            try:
                resp = await self.http_client.get(
                    ESEARCH_BASE, params=params, timeout=self.request_timeout_seconds
                )
                resp.raise_for_status()
                data = ESearchResponse.model_validate_json(resp.text)
                pmids = data.esearchresult.idlist
                count = int(data.esearchresult.count) if data.esearchresult.count else None
                return pmids, count, []
            except httpx.HTTPStatusError as exc:
                code = exc.response.status_code
                errors = [ProviderError(code="http_status_error", message=f"PubMed ESearch HTTP {code}.", retryable=code >= 500, attempt=attempt)]
                if code == 429 or code < 500:
                    return [], None, errors
            except (httpx.HTTPError, ValueError) as exc:
                errors = [ProviderError(code="request_error", message=f"PubMed ESearch failed: {exc.__class__.__name__}.", retryable=attempt < self.retry_attempts, attempt=attempt)]
                self.logger.warning("PubMed ESearch error: %s", exc)

            if attempt < self.retry_attempts:
                await asyncio.sleep(self._retry_delay(attempt))

        return [], None, errors  # type: ignore[possibly-undefined]

    async def _esummary(
        self, pmids: list[str]
    ) -> tuple[list[PubMedArticle], list[ProviderError]]:
        if not pmids:
            return [], []

        params: dict[str, str] = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "json",
        }
        if self.api_key:
            params["api_key"] = self.api_key

        for attempt in range(1, self.retry_attempts + 1):
            await self._respect_min_interval()
            try:
                resp = await self.http_client.get(
                    ESUMMARY_BASE, params=params, timeout=self.request_timeout_seconds
                )
                resp.raise_for_status()
                raw: dict = resp.json()
                result_block = raw.get("result", {})
                uids = result_block.get("uids", pmids)
                articles: list[PubMedArticle] = []
                for uid in uids:
                    entry = result_block.get(uid)
                    if not isinstance(entry, dict):
                        continue
                    try:
                        articles.append(self._parse_esummary_entry(uid, entry))
                    except Exception as exc:  # noqa: BLE001
                        self.logger.warning("PubMed ESummary entry %s parse error: %s", uid, exc)
                return articles, []
            except httpx.HTTPStatusError as exc:
                code = exc.response.status_code
                errors = [ProviderError(code="http_status_error", message=f"PubMed ESummary HTTP {code}.", retryable=code >= 500, attempt=attempt)]
                if code < 500:
                    return [], errors
            except (httpx.HTTPError, ValueError) as exc:
                errors = [ProviderError(code="request_error", message=f"PubMed ESummary failed: {exc.__class__.__name__}.", retryable=attempt < self.retry_attempts, attempt=attempt)]
                self.logger.warning("PubMed ESummary error: %s", exc)

            if attempt < self.retry_attempts:
                await asyncio.sleep(self._retry_delay(attempt))

        return [], errors  # type: ignore[possibly-undefined]

    async def _efetch_abstracts(self, pmids: list[str]) -> tuple[dict[str, str], list[ProviderError]]:
        """Fetch abstracts from EFetch XML for a list of PMIDs. Best-effort."""
        if not pmids:
            return {}, []

        params: dict[str, str] = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "rettype": "abstract",
            "retmode": "xml",
        }
        if self.api_key:
            params["api_key"] = self.api_key

        try:
            await self._respect_min_interval()
            resp = await self.http_client.get(
                EFETCH_BASE, params=params, timeout=self.request_timeout_seconds
            )
            resp.raise_for_status()
            return self._parse_efetch_abstracts(resp.text), []
        except Exception as exc:  # noqa: BLE001
            self.logger.warning("PubMed EFetch abstracts failed (best-effort): %s", exc)
            return {}, []

    def _parse_efetch_abstracts(self, xml_text: str) -> dict[str, str]:
        abstracts: dict[str, str] = {}
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError:
            return abstracts

        for article in root.findall(".//PubmedArticle"):
            pmid_el = article.find(".//PMID")
            if pmid_el is None or not pmid_el.text:
                continue
            pmid = pmid_el.text.strip()
            # Collect all AbstractText nodes, some have labels (BACKGROUND, etc.)
            abstract_parts: list[str] = []
            for at in article.findall(".//AbstractText"):
                label = at.get("Label")
                text = "".join(at.itertext()).strip()
                if text:
                    abstract_parts.append(f"{label}: {text}" if label else text)
            if abstract_parts:
                abstracts[pmid] = " ".join(abstract_parts)
        return abstracts

    def _parse_esummary_entry(self, uid: str, entry: dict) -> PubMedArticle:
        authors = []
        for a in entry.get("authors", []):
            if isinstance(a, dict) and a.get("name"):
                authors.append(PubMedAuthor(name=a["name"]))

        article_ids = []
        for ai in entry.get("articleids", []):
            if isinstance(ai, dict):
                article_ids.append(PubMedArticleId(idtype=ai.get("idtype"), value=ai.get("value")))

        return PubMedArticle(
            uid=uid,
            title=entry.get("title"),
            sortfirstauthor=entry.get("sortfirstauthor"),
            authors=authors,
            pubdate=entry.get("pubdate"),
            epubdate=entry.get("epubdate"),
            source=entry.get("source"),
            volume=entry.get("volume"),
            issue=entry.get("issue"),
            pages=entry.get("pages"),
            lang=entry.get("lang", []),
            articleids=article_ids,
            fulljournalname=entry.get("fulljournalname"),
            elocationid=entry.get("elocationid"),
            attributes=entry.get("attributes", []),
        )

    def _normalize(self, article: PubMedArticle) -> SearchResultItem:
        doi = next((aid.value for aid in article.articleids if aid.idtype == "doi"), None)
        pmc = next((aid.value for aid in article.articleids if aid.idtype == "pmc"), None)
        pmid_url = f"https://pubmed.ncbi.nlm.nih.gov/{article.uid}/"
        pdf_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmc}/pdf/" if pmc else None
        open_access = pmc is not None

        year: int | None = None
        if article.pubdate:
            try:
                year = int(article.pubdate[:4])
            except (ValueError, TypeError):
                pass

        authors = [a.name for a in article.authors if a.name]

        return SearchResultItem(
            paper_id=f"pubmed:{article.uid}",
            title=article.title or "(No title)",
            authors=authors,
            year=year,
            venue=article.fulljournalname or article.source or "PubMed",
            source="PubMed",
            abstract=article.abstract,
            score=None,
            doi=doi,
            url=pmid_url,
            pdf_url=pdf_url,
            open_access=open_access,
            tags=[],
        )

    async def _respect_min_interval(self) -> None:
        async with self._rate_limit_lock:
            elapsed = monotonic() - self._last_request_started_at
            if self._last_request_started_at and elapsed < self.min_interval_seconds:
                await asyncio.sleep(self.min_interval_seconds - elapsed)
            self._last_request_started_at = monotonic()

    def _retry_delay(self, attempt: int) -> float:
        base = self.retry_backoff_seconds * (2 ** (attempt - 1))
        return base + random.uniform(0, self.retry_jitter_seconds)
