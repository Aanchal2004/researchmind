from __future__ import annotations

import asyncio
import logging
from time import monotonic, perf_counter

import httpx

from app.providers.search.base import SearchProviderResult
from app.providers.search.semantic_scholar_models import (
    SemanticScholarPaper,
    SemanticScholarSearchResponse,
)
from app.schemas.search import ProviderError, ProviderReport, SearchRequest, SearchResultItem

SEMANTIC_SCHOLAR_FIELDS = ",".join(
    [
        "title",
        "abstract",
        "authors",
        "year",
        "venue",
        "url",
        "externalIds",
        "openAccessPdf",
        "isOpenAccess",
        "fieldsOfStudy",
    ]
)


class SemanticScholarSearchProvider:
    source_name = "semantic_scholar"

    def __init__(
        self,
        http_client: httpx.AsyncClient,
        base_url: str,
        api_key: str | None,
        max_results_per_request: int,
        retry_attempts: int,
        retry_backoff_seconds: float,
        request_timeout_seconds: float,
        min_interval_seconds: float,
    ) -> None:
        self.http_client = http_client
        self.base_url = base_url
        self.api_key = api_key.strip() if api_key else None
        self.max_results_per_request = max_results_per_request
        self.retry_attempts = max(1, retry_attempts)
        self.retry_backoff_seconds = max(0.0, retry_backoff_seconds)
        self.request_timeout_seconds = request_timeout_seconds
        self.min_interval_seconds = max(0.0, min_interval_seconds)
        self.logger = logging.getLogger("researchmind.providers.semantic_scholar")
        self._rate_limit_lock = asyncio.Lock()
        self._last_request_started_at = 0.0

    async def search(self, payload: SearchRequest) -> SearchProviderResult:
        started_at = perf_counter()
        requested_limit = min(payload.limit, self.max_results_per_request)
        offset = max(0, (payload.page - 1) * requested_limit)

        response_payload, errors = await self._fetch_with_retries(
            query=self._normalize_query(payload.query),
            limit=requested_limit,
            offset=offset,
        )

        items: list[SearchResultItem] = []
        total_results = None
        next_page = None
        if response_payload is not None:
            items = [self._normalize_paper(paper) for paper in response_payload.data]
            total_results = response_payload.total
            if total_results is not None and offset + len(items) < total_results:
                next_page = payload.page + 1

        status = "ok"
        if errors and items:
            status = "partial"
        elif errors:
            status = "error"

        return SearchProviderResult(
            items=items,
            report=ProviderReport(
                source=self.source_name,
                status=status,
                query_strategy="plain_text_search",
                page=payload.page,
                requested_limit=requested_limit,
                served_count=len(items),
                total_results=total_results,
                next_page=next_page,
                latency_ms=round((perf_counter() - started_at) * 1000, 2),
                errors=errors,
            ),
        )

    async def _fetch_with_retries(
        self,
        *,
        query: str,
        limit: int,
        offset: int,
    ) -> tuple[SemanticScholarSearchResponse | None, list[ProviderError]]:
        errors: list[ProviderError] = []
        headers = {"x-api-key": self.api_key} if self.api_key else None

        for attempt in range(1, self.retry_attempts + 1):
            await self._respect_min_interval()
            request_started_at = perf_counter()

            try:
                response = await self.http_client.get(
                    self.base_url,
                    params={
                        "query": query,
                        "limit": limit,
                        "offset": offset,
                        "fields": SEMANTIC_SCHOLAR_FIELDS,
                    },
                    headers=headers,
                    timeout=self.request_timeout_seconds,
                )
                response.raise_for_status()
                payload = SemanticScholarSearchResponse.model_validate_json(response.text)

                self.logger.info(
                    "Semantic Scholar request completed",
                    extra={
                        "offset": offset,
                        "limit": limit,
                        "attempt": attempt,
                        "latency_ms": round((perf_counter() - request_started_at) * 1000, 2),
                    },
                )
                return payload, errors
            except httpx.TimeoutException:
                errors.append(
                    ProviderError(
                        code="timeout",
                        message="Semantic Scholar request timed out.",
                        retryable=attempt < self.retry_attempts,
                        attempt=attempt,
                    )
                )
                self.logger.warning("Semantic Scholar request timed out", extra={"attempt": attempt})
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                retry_after = exc.response.headers.get("Retry-After")
                retryable = status_code in {408, 409, 425, 429} or status_code >= 500
                message = f"Semantic Scholar returned HTTP {status_code}."
                if status_code == 429 and not self.api_key:
                    message += " Add a Semantic Scholar API key for higher rate limits."

                errors.append(
                    ProviderError(
                        code="http_status_error",
                        message=message,
                        retryable=retryable and attempt < self.retry_attempts,
                        attempt=attempt,
                    )
                )
                self.logger.warning(
                    "Semantic Scholar request failed with status %s",
                    status_code,
                    extra={"attempt": attempt, "retry_after": retry_after},
                )

                if retryable and attempt < self.retry_attempts:
                    await asyncio.sleep(self._resolve_retry_delay(attempt, retry_after))
                    continue
                break
            except httpx.HTTPError as exc:
                errors.append(
                    ProviderError(
                        code="http_error",
                        message=f"Semantic Scholar request failed: {exc.__class__.__name__}.",
                        retryable=attempt < self.retry_attempts,
                        attempt=attempt,
                    )
                )
                self.logger.warning("Semantic Scholar request failed: %s", exc)
            except ValueError as exc:
                errors.append(
                    ProviderError(
                        code="parse_error",
                        message=f"Semantic Scholar response parsing failed: {exc}.",
                        retryable=False,
                        attempt=attempt,
                    )
                )
                self.logger.warning("Semantic Scholar response parsing failed: %s", exc)
                break

            if attempt < self.retry_attempts:
                await asyncio.sleep(self.retry_backoff_seconds * attempt)

        return None, errors

    async def _respect_min_interval(self) -> None:
        async with self._rate_limit_lock:
            elapsed = monotonic() - self._last_request_started_at
            if self._last_request_started_at and elapsed < self.min_interval_seconds:
                await asyncio.sleep(self.min_interval_seconds - elapsed)
            self._last_request_started_at = monotonic()

    def _resolve_retry_delay(self, attempt: int, retry_after: str | None) -> float:
        if retry_after:
            try:
                return max(float(retry_after), self.retry_backoff_seconds)
            except ValueError:
                return self.retry_backoff_seconds * attempt
        return self.retry_backoff_seconds * attempt

    def _normalize_paper(self, paper: SemanticScholarPaper) -> SearchResultItem:
        doi = paper.externalIds.DOI if paper.externalIds else None
        pdf_url = paper.openAccessPdf.url if paper.openAccessPdf else None
        tags = [field for field in paper.fieldsOfStudy[:5] if field]

        return SearchResultItem(
            paper_id=f"semantic_scholar:{paper.paperId}",
            title=paper.title,
            authors=[author.name for author in paper.authors if author.name],
            year=paper.year,
            venue=paper.venue or "Semantic Scholar",
            source="Semantic Scholar",
            abstract=paper.abstract,
            score=None,
            doi=doi,
            url=paper.url,
            pdf_url=pdf_url,
            open_access=bool(pdf_url or paper.isOpenAccess),
            tags=tags,
        )

    def _normalize_query(self, query: str) -> str:
        # Semantic Scholar warns that hyphenated terms do not match, so we
        # normalize them into spaces before sending plain-text queries.
        return " ".join(query.replace("-", " ").split())
