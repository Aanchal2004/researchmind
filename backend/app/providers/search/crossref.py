from __future__ import annotations

import asyncio
import logging
import re
import random
from time import monotonic, perf_counter

import httpx

from app.providers.search.base import SearchProviderResult
from app.providers.search.crossref_models import CrossrefSearchResponse, CrossrefWork
from app.schemas.search import ProviderError, ProviderReport, SearchRequest, SearchResultItem

CROSSREF_WORKS_URL = "https://api.crossref.org/works"
# Strip HTML tags from Crossref abstracts (they use JATS markup).
_HTML_TAG_RE = re.compile(r"<[^>]+>")


class CrossrefSearchProvider:
    source_name = "crossref"

    def __init__(
        self,
        http_client: httpx.AsyncClient,
        mailto: str | None,
        max_results_per_request: int,
        retry_attempts: int,
        retry_backoff_seconds: float,
        retry_jitter_seconds: float,
        request_timeout_seconds: float,
        total_budget_seconds: float,
        min_interval_seconds: float,
    ) -> None:
        self.http_client = http_client
        # Crossref Polite Pool: provide mailto for better reliability.
        self.mailto = mailto
        self.max_results_per_request = max_results_per_request
        self.retry_attempts = max(1, retry_attempts)
        self.retry_backoff_seconds = max(0.0, retry_backoff_seconds)
        self.retry_jitter_seconds = max(0.0, retry_jitter_seconds)
        self.request_timeout_seconds = request_timeout_seconds
        self.total_budget_seconds = total_budget_seconds
        self.min_interval_seconds = max(0.0, min_interval_seconds)
        self.logger = logging.getLogger("researchmind.providers.crossref")
        self._rate_limit_lock = asyncio.Lock()
        self._last_request_started_at = 0.0

    async def search(self, payload: SearchRequest) -> SearchProviderResult:
        started_at = perf_counter()
        requested_limit = min(payload.limit, self.max_results_per_request)
        offset = max(0, (payload.page - 1) * requested_limit)
        errors: list[ProviderError] = []
        items: list[SearchResultItem] = []
        total_results: int | None = None
        next_page: int | None = None

        try:
            async with asyncio.timeout(self.total_budget_seconds):
                works, total_results, req_errors = await self._fetch_works(
                    query=payload.query,
                    rows=requested_limit,
                    offset=offset,
                )
                errors.extend(req_errors)

                if works:
                    items = [self._normalize(work) for work in works if work.primary_title()]
                    if total_results is not None and offset + len(items) < total_results:
                        next_page = payload.page + 1

        except TimeoutError:
            errors.append(
                ProviderError(
                    code="budget_exceeded",
                    message="Crossref provider exceeded the total request budget.",
                    retryable=True,
                )
            )
            self.logger.warning("Crossref provider budget exceeded")

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
                query_strategy="bibliographic_query",
                page=payload.page,
                requested_limit=requested_limit,
                served_count=len(items),
                total_results=total_results,
                next_page=next_page,
                latency_ms=round((perf_counter() - started_at) * 1000, 2),
                errors=errors,
            ),
        )

    async def _fetch_works(
        self,
        *,
        query: str,
        rows: int,
        offset: int,
    ) -> tuple[list[CrossrefWork], int | None, list[ProviderError]]:
        params: dict[str, str | int] = {
            "query.bibliographic": query,
            "rows": rows,
            "offset": offset,
            "select": "DOI,title,author,published,published-print,published-online,container-title,abstract,URL,type,score,is-referenced-by-count,subject",
        }
        if self.mailto:
            params["mailto"] = self.mailto

        for attempt in range(1, self.retry_attempts + 1):
            await self._respect_min_interval()
            try:
                resp = await self.http_client.get(
                    CROSSREF_WORKS_URL,
                    params=params,
                    timeout=self.request_timeout_seconds,
                )
                resp.raise_for_status()
                data = CrossrefSearchResponse.model_validate_json(resp.text)
                if data.message is None:
                    return [], None, [ProviderError(code="empty_response", message="Crossref returned no message block.", retryable=False)]

                total = data.message.total_results
                return data.message.items, total, []

            except httpx.HTTPStatusError as exc:
                code = exc.response.status_code
                retryable = code >= 500
                errors = [ProviderError(code="http_status_error", message=f"Crossref HTTP {code}.", retryable=retryable and attempt < self.retry_attempts, attempt=attempt)]
                self.logger.warning("Crossref request failed with status %s", code, extra={"attempt": attempt})
                if code == 429 or not retryable:
                    return [], None, errors
            except (httpx.HTTPError, ValueError) as exc:
                errors = [ProviderError(code="request_error", message=f"Crossref request failed: {exc.__class__.__name__}.", retryable=attempt < self.retry_attempts, attempt=attempt)]
                self.logger.warning("Crossref request failed: %s", exc)

            if attempt < self.retry_attempts:
                await asyncio.sleep(self._retry_delay(attempt))

        return [], None, errors  # type: ignore[possibly-undefined]

    def _normalize(self, work: CrossrefWork) -> SearchResultItem:
        doi = work.DOI
        url = work.URL or (f"https://doi.org/{doi}" if doi else None)
        abstract = _HTML_TAG_RE.sub("", work.abstract).strip() if work.abstract else None
        authors = [a.display_name() for a in work.author]
        tags = [s.lower().replace(" ", "-") for s in work.subject[:5]]

        # Crossref scores are unbounded relevance numbers; normalise to [0, 1].
        normalised_score = min(1.0, (work.score or 0.0) / 100.0) if work.score else None

        return SearchResultItem(
            paper_id=f"crossref:{doi or work.primary_title()[:40]}",
            title=work.primary_title(),
            authors=authors,
            year=work.year(),
            venue=work.venue(),
            source="Crossref",
            abstract=abstract,
            score=normalised_score,
            doi=doi,
            url=url,
            pdf_url=None,
            open_access=False,
            tags=tags,
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
