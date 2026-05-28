from __future__ import annotations

import asyncio
import logging
import random
import re
from collections.abc import Sequence
from dataclasses import dataclass
from time import monotonic, perf_counter
from xml.etree import ElementTree as ET

import httpx

from app.providers.search.arxiv_models import ArxivEntry, ArxivFeed, ArxivLink
from app.providers.search.base import SearchProviderResult
from app.schemas.search import ProviderError, ProviderReport, SearchRequest, SearchResultItem

ATOM_NAMESPACE = {
    "atom": "http://www.w3.org/2005/Atom",
    "arxiv": "http://arxiv.org/schemas/atom",
}
OPENSEARCH_NAMESPACE = {"opensearch": "http://a9.com/-/spec/opensearch/1.1/"}
TOKEN_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9._+-]*")


@dataclass(slots=True)
class CachedSearchPayload:
    items: list[SearchResultItem]
    query_strategy: str
    total_results: int | None
    next_page: int | None
    expires_at: float


class ArxivSearchProvider:
    source_name = "arxiv"

    def __init__(
        self,
        http_client: httpx.AsyncClient,
        base_url: str,
        max_results_per_request: int,
        page_size: int,
        retry_attempts: int,
        retry_backoff_seconds: float,
        retry_jitter_seconds: float,
        request_timeout_seconds: float,
        total_budget_seconds: float,
        min_interval_seconds: float,
        cache_ttl_seconds: float,
        circuit_breaker_threshold: int,
        circuit_breaker_open_seconds: float,
        max_concurrent_requests: int,
        sort_by: str,
        sort_order: str,
    ) -> None:
        self.http_client = http_client
        self.base_url = base_url
        self.max_results_per_request = max_results_per_request
        self.page_size = max(1, page_size)
        self.retry_attempts = max(1, retry_attempts)
        self.retry_backoff_seconds = max(0.0, retry_backoff_seconds)
        self.retry_jitter_seconds = max(0.0, retry_jitter_seconds)
        self.request_timeout_seconds = request_timeout_seconds
        self.total_budget_seconds = total_budget_seconds
        self.min_interval_seconds = max(0.0, min_interval_seconds)
        self.cache_ttl_seconds = max(0.0, cache_ttl_seconds)
        self.circuit_breaker_threshold = max(1, circuit_breaker_threshold)
        self.circuit_breaker_open_seconds = max(1.0, circuit_breaker_open_seconds)
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.logger = logging.getLogger("researchmind.providers.arxiv")
        self.health_logger = logging.getLogger("researchmind.providers.arxiv.health")
        self._request_semaphore = asyncio.Semaphore(max(1, max_concurrent_requests))
        self._rate_limit_lock = asyncio.Lock()
        self._last_request_started_at = 0.0
        self._cache: dict[str, CachedSearchPayload] = {}
        self._cache_lock = asyncio.Lock()
        self._consecutive_failures = 0
        self._circuit_open_until = 0.0

    async def search(self, payload: SearchRequest) -> SearchProviderResult:
        started_at = perf_counter()
        requested_limit = min(payload.limit, self.max_results_per_request)
        start_index = max(0, (payload.page - 1) * requested_limit)
        chunk_size = min(self.page_size, requested_limit)
        cache_key = self._build_cache_key(payload, requested_limit)

        cached = await self._get_cached_result(cache_key)
        if cached is not None:
            return SearchProviderResult(
                items=cached.items,
                report=ProviderReport(
                    source=self.source_name,
                    status="ok",
                    query_strategy=f"{cached.query_strategy}_cache",
                    page=payload.page,
                    requested_limit=requested_limit,
                    served_count=len(cached.items),
                    total_results=cached.total_results,
                    next_page=cached.next_page,
                    latency_ms=round((perf_counter() - started_at) * 1000, 2),
                    errors=[],
                ),
            )

        if self._circuit_is_open():
            return SearchProviderResult(
                items=[],
                report=ProviderReport(
                    source=self.source_name,
                    status="error",
                    query_strategy="circuit_breaker_open",
                    page=payload.page,
                    requested_limit=requested_limit,
                    served_count=0,
                    total_results=None,
                    next_page=None,
                    latency_ms=round((perf_counter() - started_at) * 1000, 2),
                    errors=[
                        ProviderError(
                            code="circuit_open",
                            message="arXiv provider is temporarily paused after repeated failures.",
                            retryable=True,
                        )
                    ],
                ),
            )

        feeds: list[ArxivFeed] = []
        errors: list[ProviderError] = []
        query_strategy = "unresolved"
        total_results: int | None = None
        next_page: int | None = None

        try:
            async with asyncio.timeout(self.total_budget_seconds):
                for strategy_name, expression in self._build_query_candidates(payload.query):
                    feeds.clear()
                    errors.clear()
                    query_strategy = strategy_name
                    total_results = None
                    next_page = None
                    remaining = requested_limit
                    current_start = start_index

                    while remaining > 0:
                        current_chunk_size = min(chunk_size, remaining)
                        feed, request_errors = await self._fetch_feed_with_retries(
                            expression=expression,
                            start=current_start,
                            max_results=current_chunk_size,
                        )
                        errors.extend(request_errors)

                        if feed is None:
                            break

                        feeds.append(feed)
                        total_results = feed.total_results if feed.total_results is not None else total_results
                        received_count = len(feed.entries)
                        remaining -= received_count
                        current_start += received_count

                        if total_results is not None and current_start < total_results:
                            next_page = payload.page + 1

                        # Stop paging if the feed is exhausted or nothing new came back.
                        if received_count < current_chunk_size or received_count == 0:
                            break

                    items = self._normalize_feeds(feeds)
                    if items:
                        report = self._build_report(
                            payload=payload,
                            requested_limit=requested_limit,
                            items=items,
                            query_strategy=query_strategy,
                            started_at=started_at,
                            total_results=total_results,
                            next_page=next_page,
                            errors=errors,
                        )
                        await self._set_cached_result(
                            cache_key,
                            items=items,
                            query_strategy=query_strategy,
                            total_results=total_results,
                            next_page=next_page,
                        )
                        self._record_success()
                        return SearchProviderResult(items=items, report=report)

                    if self._has_rate_limit_error(errors):
                        break

                    if not errors:
                        continue
        except TimeoutError:
            errors.append(
                ProviderError(
                    code="budget_exceeded",
                    message="arXiv provider exceeded the total request budget.",
                    retryable=True,
                )
            )
            self.logger.warning(
                "arXiv provider budget exceeded",
                extra={"page": payload.page, "limit": requested_limit},
            )

        items = self._normalize_feeds(feeds)
        if items:
            report = self._build_report(
                payload=payload,
                requested_limit=requested_limit,
                items=items,
                query_strategy=query_strategy,
                started_at=started_at,
                total_results=total_results,
                next_page=next_page,
                errors=errors,
            )
            await self._set_cached_result(
                cache_key,
                items=items,
                query_strategy=query_strategy,
                total_results=total_results,
                next_page=next_page,
            )
            self._record_success()
            return SearchProviderResult(items=items, report=report)

        self._record_failure(errors)
        report = self._build_report(
            payload=payload,
            requested_limit=requested_limit,
            items=[],
            query_strategy=query_strategy,
            started_at=started_at,
            total_results=total_results,
            next_page=next_page,
            errors=errors,
        )
        return SearchProviderResult(items=[], report=report)

    def _build_query_candidates(self, raw_query: str) -> list[tuple[str, str]]:
        normalized_query = " ".join(raw_query.split())
        tokens = self._extract_tokens(normalized_query)
        if not tokens:
            return [("all_query", f'all:"{normalized_query}"')]

        quoted_query = f'"{normalized_query}"'
        candidates: list[tuple[str, str]] = []

        if len(tokens) > 1:
            candidates.append(("title_or_abstract_phrase", f'ti:{quoted_query} OR abs:{quoted_query}'))
            candidates.append(("all_phrase", f"all:{quoted_query}"))
            candidates.append(
                (
                    "all_terms_and",
                    " AND ".join(f"all:{token}" for token in tokens),
                )
            )
        else:
            token = tokens[0]
            candidates.append(("title_or_abstract_term", f"ti:{token} OR abs:{token}"))
            candidates.append(("all_term", f"all:{token}"))

        return candidates

    async def _fetch_feed_with_retries(
        self,
        *,
        expression: str,
        start: int,
        max_results: int,
    ) -> tuple[ArxivFeed | None, list[ProviderError]]:
        errors: list[ProviderError] = []

        for attempt in range(1, self.retry_attempts + 1):
            request_started_at = perf_counter()
            try:
                feed = await self._perform_request(
                    expression=expression,
                    start=start,
                    max_results=max_results,
                )

                latency_ms = round((perf_counter() - request_started_at) * 1000, 2)
                self.logger.info(
                    "arXiv request completed",
                    extra={
                        "query_strategy": expression,
                        "start": start,
                        "max_results": max_results,
                        "attempt": attempt,
                        "latency_ms": latency_ms,
                    },
                )

                if self._is_error_feed(feed):
                    errors.append(
                        ProviderError(
                            code="api_error_feed",
                            message="arXiv returned an Atom error feed.",
                            retryable=False,
                            attempt=attempt,
                        )
                    )
                    return None, errors

                return feed, errors
            except httpx.TimeoutException:
                retryable = attempt < self.retry_attempts
                errors.append(
                    ProviderError(
                        code="timeout",
                        message="arXiv request timed out.",
                        retryable=retryable,
                        attempt=attempt,
                    )
                )
                self.logger.warning(
                    "arXiv request timed out",
                    extra={"attempt": attempt, "start": start, "max_results": max_results},
                )
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                retryable = status_code >= 500
                error_code = "rate_limited" if status_code == 429 else "http_status_error"
                errors.append(
                    ProviderError(
                        code=error_code,
                        message=f"arXiv returned HTTP {status_code}.",
                        retryable=retryable and attempt < self.retry_attempts,
                        attempt=attempt,
                    )
                )
                self.logger.warning(
                    "arXiv request failed with status %s",
                    status_code,
                    extra={"attempt": attempt, "start": start, "max_results": max_results},
                )
                # arXiv rate limits are strict; do not retry immediately on 429.
                if status_code == 429:
                    break
                if not retryable:
                    break
            except httpx.HTTPError as exc:
                retryable = attempt < self.retry_attempts
                errors.append(
                    ProviderError(
                        code="http_error",
                        message=f"arXiv request failed: {exc.__class__.__name__}.",
                        retryable=retryable,
                        attempt=attempt,
                    )
                )
                self.logger.warning("arXiv request failed: %s", exc)
            except (ET.ParseError, ValueError) as exc:
                errors.append(
                    ProviderError(
                        code="parse_error",
                        message=f"arXiv response parsing failed: {exc}.",
                        retryable=False,
                        attempt=attempt,
                    )
                )
                self.logger.warning("arXiv response parsing failed: %s", exc)
                break

            if attempt < self.retry_attempts:
                delay = self._compute_retry_delay(attempt)
                self.logger.info(
                    "arXiv retry scheduled",
                    extra={
                        "attempt": attempt,
                        "next_attempt": attempt + 1,
                        "retry_delay_seconds": delay,
                    },
                )
                await asyncio.sleep(delay)

        return None, errors

    async def _perform_request(
        self,
        *,
        expression: str,
        start: int,
        max_results: int,
    ) -> ArxivFeed:
        async with self._request_semaphore:
            await self._respect_min_interval()
            response = await self.http_client.get(
                self.base_url,
                params=self._build_query_params(
                    expression=expression,
                    start=start,
                    max_results=max_results,
                ),
                timeout=httpx.Timeout(self.request_timeout_seconds),
            )
            response.raise_for_status()
            return self._parse_feed(response.text)

    async def _respect_min_interval(self) -> None:
        async with self._rate_limit_lock:
            elapsed = monotonic() - self._last_request_started_at
            if self._last_request_started_at and elapsed < self.min_interval_seconds:
                await asyncio.sleep(self.min_interval_seconds - elapsed)
            self._last_request_started_at = monotonic()

    def _compute_retry_delay(self, attempt: int) -> float:
        base_delay = self.retry_backoff_seconds * (2 ** (attempt - 1))
        return base_delay + random.uniform(0, self.retry_jitter_seconds)

    def _build_query_params(
        self,
        *,
        expression: str,
        start: int,
        max_results: int,
    ) -> dict[str, int | str]:
        return {
            "search_query": expression,
            "start": start,
            "max_results": max_results,
            "sortBy": self.sort_by,
            "sortOrder": self.sort_order,
        }

    def _parse_feed(self, xml_text: str) -> ArxivFeed:
        root = ET.fromstring(xml_text.lstrip())
        total_results = self._extract_int_metadata(root, "opensearch:totalResults")
        start_index = self._extract_int_metadata(root, "opensearch:startIndex")
        items_per_page = self._extract_int_metadata(root, "opensearch:itemsPerPage")

        entries: list[ArxivEntry] = []
        # We validate the parsed XML into typed models here so upstream services
        # can depend on one stable Python shape rather than raw XML nodes.
        for entry_node in root.findall("atom:entry", ATOM_NAMESPACE):
            try:
                entry_data = {
                    "entry_id": self._node_text(entry_node, "atom:id"),
                    "title": self._clean_text(self._node_text(entry_node, "atom:title")),
                    "summary": self._clean_text(self._node_text(entry_node, "atom:summary")),
                    "published": self._node_text(entry_node, "atom:published"),
                    "updated": self._node_text(entry_node, "atom:updated"),
                    "authors": [
                        self._clean_text(author_name.text or "")
                        for author_name in entry_node.findall("atom:author/atom:name", ATOM_NAMESPACE)
                        if (author_name.text or "").strip()
                    ],
                    "categories": [
                        category.attrib["term"]
                        for category in entry_node.findall("atom:category", ATOM_NAMESPACE)
                        if category.attrib.get("term")
                    ],
                    "primary_category": self._extract_primary_category(entry_node),
                    "journal_ref": self._node_text(entry_node, "arxiv:journal_ref"),
                    "doi": self._node_text(entry_node, "arxiv:doi"),
                    "comment": self._node_text(entry_node, "arxiv:comment"),
                    "links": [
                        ArxivLink(
                            href=link.attrib.get("href", ""),
                            rel=link.attrib.get("rel"),
                            title=link.attrib.get("title"),
                            type=link.attrib.get("type"),
                        )
                        for link in entry_node.findall("atom:link", ATOM_NAMESPACE)
                        if link.attrib.get("href")
                    ],
                }
                entries.append(ArxivEntry.model_validate(entry_data))
            except Exception as exc:  # noqa: BLE001
                self.logger.warning("skipping malformed arXiv entry: %s", exc)

        return ArxivFeed(
            total_results=total_results,
            start_index=start_index,
            items_per_page=items_per_page,
            entries=entries,
        )

    def _normalize_feeds(self, feeds: Sequence[ArxivFeed]) -> list[SearchResultItem]:
        all_entries = [entry for feed in feeds for entry in feed.entries]
        total = len(all_entries)
        return [
            self._normalize_entry(entry, index=index, total=total)
            for index, entry in enumerate(all_entries)
        ]

    def _normalize_entry(
        self,
        entry: ArxivEntry,
        *,
        index: int,
        total: int,
    ) -> SearchResultItem:
        article_id = self._extract_article_id(entry.entry_id)
        pdf_url = self._find_link(entry.links, title="pdf")
        article_url = self._find_link(entry.links, rel="alternate") or entry.entry_id
        tags = [tag for tag in entry.categories[:5] if tag]
        if entry.primary_category and entry.primary_category not in tags:
            tags.insert(0, entry.primary_category)

        rank_score = 1.0 if total <= 1 else round(1 - (index / total), 4)

        return SearchResultItem(
            paper_id=f"arxiv:{article_id}",
            title=entry.title,
            authors=entry.authors,
            year=entry.published.year if entry.published else None,
            venue=entry.journal_ref or entry.primary_category or "arXiv",
            source="arXiv",
            abstract=entry.summary,
            score=rank_score,
            doi=entry.doi,
            url=article_url,
            pdf_url=pdf_url,
            open_access=True,
            tags=tags,
        )

    async def _get_cached_result(self, cache_key: str) -> CachedSearchPayload | None:
        if self.cache_ttl_seconds <= 0:
            return None

        async with self._cache_lock:
            cached = self._cache.get(cache_key)
            if cached is None:
                return None
            if cached.expires_at <= monotonic():
                self._cache.pop(cache_key, None)
                return None
            return cached

    async def _set_cached_result(
        self,
        cache_key: str,
        *,
        items: list[SearchResultItem],
        query_strategy: str,
        total_results: int | None,
        next_page: int | None,
    ) -> None:
        if self.cache_ttl_seconds <= 0:
            return

        async with self._cache_lock:
            self._cache[cache_key] = CachedSearchPayload(
                items=[item.model_copy() for item in items],
                query_strategy=query_strategy,
                total_results=total_results,
                next_page=next_page,
                expires_at=monotonic() + self.cache_ttl_seconds,
            )

    def _build_cache_key(self, payload: SearchRequest, requested_limit: int) -> str:
        return "|".join(
            [
                payload.query.strip().lower(),
                str(payload.page),
                str(requested_limit),
                str(self.sort_by),
                str(self.sort_order),
            ]
        )

    def _extract_int_metadata(self, root: ET.Element, path: str) -> int | None:
        node = root.find(path, OPENSEARCH_NAMESPACE)
        if node is None or not node.text:
            return None
        try:
            return int(node.text)
        except ValueError:
            return None

    def _extract_primary_category(self, entry_node: ET.Element) -> str | None:
        primary_category = entry_node.find("arxiv:primary_category", ATOM_NAMESPACE)
        if primary_category is None:
            return None
        return primary_category.attrib.get("term")

    def _find_link(
        self,
        links: Sequence[ArxivLink],
        *,
        rel: str | None = None,
        title: str | None = None,
    ) -> str | None:
        for link in links:
            if rel is not None and link.rel != rel:
                continue
            if title is not None and link.title != title:
                continue
            return link.href
        return None

    def _is_error_feed(self, feed: ArxivFeed) -> bool:
        return bool(
            len(feed.entries) == 1
            and feed.entries[0].title.lower() == "error"
            and "/errors#" in feed.entries[0].entry_id
        )

    def _extract_article_id(self, entry_id: str) -> str:
        for prefix in ("https://arxiv.org/abs/", "http://arxiv.org/abs/"):
            if entry_id.startswith(prefix):
                return entry_id.removeprefix(prefix)
        return entry_id

    def _node_text(self, parent: ET.Element, path: str) -> str | None:
        node = parent.find(path, ATOM_NAMESPACE)
        if node is None or node.text is None:
            return None
        return node.text.strip()

    def _clean_text(self, value: str | None) -> str:
        return " ".join((value or "").split())

    def _extract_tokens(self, query: str) -> list[str]:
        return [match.group(0).lower() for match in TOKEN_PATTERN.finditer(query)]

    def _build_report(
        self,
        *,
        payload: SearchRequest,
        requested_limit: int,
        items: Sequence[SearchResultItem],
        query_strategy: str,
        started_at: float,
        total_results: int | None,
        next_page: int | None,
        errors: list[ProviderError],
    ) -> ProviderReport:
        served_count = len(items)
        status = "ok"
        if errors and items:
            status = "partial"
        elif errors:
            status = "error"

        return ProviderReport(
            source=self.source_name,
            status=status,
            query_strategy=query_strategy,
            page=payload.page,
            requested_limit=requested_limit,
            served_count=served_count,
            total_results=total_results,
            next_page=next_page,
            latency_ms=round((perf_counter() - started_at) * 1000, 2),
            errors=errors,
        )

    def _circuit_is_open(self) -> bool:
        return monotonic() < self._circuit_open_until

    def _record_success(self) -> None:
        if self._consecutive_failures or self._circuit_open_until:
            self.health_logger.info("arXiv provider recovered")
        self._consecutive_failures = 0
        self._circuit_open_until = 0.0

    def _record_failure(self, errors: Sequence[ProviderError]) -> None:
        if not errors:
            return
        self._consecutive_failures += 1
        self.health_logger.warning(
            "arXiv provider failure streak",
            extra={"consecutive_failures": self._consecutive_failures},
        )
        if self._consecutive_failures >= self.circuit_breaker_threshold:
            self._circuit_open_until = monotonic() + self.circuit_breaker_open_seconds
            self.health_logger.warning(
                "arXiv circuit breaker opened",
                extra={"open_seconds": self.circuit_breaker_open_seconds},
            )

    def _has_rate_limit_error(self, errors: Sequence[ProviderError]) -> bool:
        return any(error.code == "rate_limited" for error in errors)
