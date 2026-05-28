from __future__ import annotations

import asyncio
from collections.abc import Sequence
from datetime import UTC, datetime
import logging
from time import perf_counter
from uuid import uuid4

from app.providers.search.base import SearchProvider, SearchProviderResult
from app.schemas.search import (
    ProviderReport,
    SearchMeta,
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    SearchSynthesis,
)


class SearchService:
    def __init__(
        self,
        providers: Sequence[SearchProvider],
        default_limit: int,
        max_limit: int,
    ) -> None:
        self.providers = list(providers)
        self.default_limit = default_limit
        self.max_limit = max_limit
        self.logger = logging.getLogger("researchmind.services.search")

    async def search(self, payload: SearchRequest) -> SearchResponse:
        started_at = perf_counter()
        limit = min(payload.limit or self.default_limit, self.max_limit)
        normalized_payload = payload.model_copy(update={"limit": limit})
        selected_providers = self._select_providers(normalized_payload)

        provider_results = await asyncio.gather(
            *(provider.search(normalized_payload) for provider in selected_providers),
            return_exceptions=True,
        )

        results, provider_reports = self._collect_results(selected_providers, provider_results)
        filtered_results = self._apply_filters(results, normalized_payload)
        ranked_results = self._rank_results(filtered_results)[:limit]
        duration_ms = round((perf_counter() - started_at) * 1000, 2)
        response_mode = self._resolve_mode(selected_providers)
        total_results = self._resolve_total_results(provider_reports, len(ranked_results))
        next_page = self._resolve_next_page(provider_reports)

        return SearchResponse(
            query=normalized_payload.query,
            results=ranked_results,
            synthesis=self._build_synthesis(ranked_results, response_mode, provider_reports),
            meta=SearchMeta(
                provider_reports=provider_reports,
                page=normalized_payload.page,
                limit=limit,
                total_results=total_results,
                next_page=next_page,
                query_id=str(uuid4()),
                mode=response_mode,
                result_count=len(ranked_results),
                provider_count=len(selected_providers),
                sources_queried=[provider.source_name for provider in selected_providers],
                duration_ms=duration_ms,
                generated_at=datetime.now(UTC),
            ),
        )

    def _select_providers(self, payload: SearchRequest) -> list[SearchProvider]:
        requested_sources = {source.strip().lower() for source in payload.filters.sources if source.strip()}
        if not requested_sources:
            return self.providers

        return [
            provider
            for provider in self.providers
            if provider.source_name.lower() in requested_sources
        ]

    def _collect_results(
        self,
        selected_providers: Sequence[SearchProvider],
        provider_results: Sequence[SearchProviderResult | Exception],
    ) -> tuple[list[SearchResultItem], list[ProviderReport]]:
        merged: dict[str, SearchResultItem] = {}
        reports: list[ProviderReport] = []

        for provider, result in zip(selected_providers, provider_results, strict=False):
            if isinstance(result, Exception):
                self.logger.warning(
                    "search provider failed: %s",
                    provider.source_name,
                    exc_info=result,
                )
                continue

            reports.append(result.report)

            for item in result.items:
                dedupe_key = self._build_dedupe_key(item)
                if dedupe_key not in merged:
                    merged[dedupe_key] = item
                    continue

                merged[dedupe_key] = self._merge_result_items(
                    existing=merged[dedupe_key],
                    incoming=item,
                )

        return list(merged.values()), reports

    def _rank_results(self, results: Sequence[SearchResultItem]) -> list[SearchResultItem]:
        return sorted(results, key=lambda item: item.score or 0.0, reverse=True)

    def _apply_filters(
        self,
        results: Sequence[SearchResultItem],
        payload: SearchRequest,
    ) -> list[SearchResultItem]:
        filtered = list(results)
        if payload.filters.open_access_only:
            filtered = [item for item in filtered if item.open_access]
        if payload.filters.year_from is not None:
            filtered = [
                item for item in filtered if item.year is None or item.year >= payload.filters.year_from
            ]
        if payload.filters.year_to is not None:
            filtered = [
                item for item in filtered if item.year is None or item.year <= payload.filters.year_to
            ]
        return filtered

    def _build_synthesis(
        self,
        results: Sequence[SearchResultItem],
        response_mode: str,
        provider_reports: Sequence[ProviderReport],
    ) -> SearchSynthesis:
        if not results:
            error_sources = [report.source for report in provider_reports if report.status != "ok"]
            summary = (
                "No results were returned from the selected providers. "
                "The retrieval layer is ready for additional source adapters and retries."
            )
            highlights = [
                "The response contract is stable even when providers return no data.",
                "Additional live providers can be added without changing the API schema.",
            ]
            if error_sources:
                summary = (
                    "No results were returned because one or more live providers degraded "
                    "during retrieval."
                )
                highlights = [
                    f"Providers with issues: {', '.join(error_sources)}",
                    "Inspect provider_reports in the response meta for structured diagnostics.",
                ]
            return SearchSynthesis(
                status="pending",
                summary=summary,
                highlights=highlights,
                sources=[],
            )

        top_result = results[0]
        return SearchSynthesis(
            status="pending",
            summary=self._build_summary_text(response_mode),
            highlights=[
                f"Top result source: {top_result.source}",
                f"Current result count: {len(results)}",
                "Result schema is ready for grounded synthesis and citation formatting.",
            ],
            sources=[item.paper_id for item in results[:5]],
        )

    def _build_summary_text(self, response_mode: str) -> str:
        if response_mode == "live":
            return (
                "Live retrieval is active. LangGraph-driven synthesis will layer on top of "
                "these normalized provider results in a later phase."
            )
        return (
            "Search retrieval is scaffolded. LangGraph-driven synthesis will sit on top "
            "of these normalized results in a later phase."
        )

    def _resolve_mode(self, selected_providers: Sequence[SearchProvider]) -> str:
        if any(provider.source_name.lower() != "stub" for provider in selected_providers):
            return "live"
        return "scaffold"

    def _resolve_total_results(
        self,
        provider_reports: Sequence[ProviderReport],
        fallback_count: int,
    ) -> int | None:
        totals = [report.total_results for report in provider_reports if report.total_results is not None]
        if totals:
            return max(totals)
        return fallback_count if provider_reports else None

    def _resolve_next_page(self, provider_reports: Sequence[ProviderReport]) -> int | None:
        next_pages = [report.next_page for report in provider_reports if report.next_page is not None]
        if not next_pages:
            return None
        return min(next_pages)

    def _build_dedupe_key(self, item: SearchResultItem) -> str:
        if item.doi:
            return f"doi:{item.doi.lower()}"

        title_key = " ".join(item.title.lower().split())
        year_key = item.year if item.year is not None else "unknown"
        return f"title:{title_key}|year:{year_key}"

    def _merge_result_items(
        self,
        *,
        existing: SearchResultItem,
        incoming: SearchResultItem,
    ) -> SearchResultItem:
        existing_score = existing.score or 0.0
        incoming_score = incoming.score or 0.0
        preferred = incoming if incoming_score > existing_score else existing
        secondary = existing if preferred is incoming else incoming

        merged_authors = list(dict.fromkeys([*preferred.authors, *secondary.authors]))
        merged_tags = list(dict.fromkeys([*preferred.tags, *secondary.tags]))

        return preferred.model_copy(
            update={
                "authors": merged_authors,
                "tags": merged_tags,
                "abstract": preferred.abstract or secondary.abstract,
                "doi": preferred.doi or secondary.doi,
                "url": preferred.url or secondary.url,
                "pdf_url": preferred.pdf_url or secondary.pdf_url,
                "venue": preferred.venue or secondary.venue,
                "open_access": preferred.open_access or secondary.open_access,
            }
        )
