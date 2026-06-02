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
from app.services.result_merger import SearchResultMerger
from app.services.synthesis import SynthesisService


class SearchService:
    def __init__(
        self,
        providers: Sequence[SearchProvider],
        default_limit: int,
        max_limit: int,
        synthesis_service: SynthesisService | None = None,
    ) -> None:
        self.providers = list(providers)
        self.default_limit = default_limit
        self.max_limit = max_limit
        self.result_merger = SearchResultMerger()
        self.synthesis_service = synthesis_service or SynthesisService(
            enabled=True,
            max_papers=5,
            max_abstract_chars=1200,
        )
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
        ranked_results = self.result_merger.merge_and_rank(
            filtered_results,
            query=normalized_payload.query,
        )[:limit]
        duration_ms = round((perf_counter() - started_at) * 1000, 2)
        response_mode = self._resolve_mode(selected_providers)
        total_results = self._resolve_total_results(provider_reports, len(ranked_results))
        next_page = self._resolve_next_page(provider_reports)
        synthesis = (
            await self.synthesis_service.synthesize(
                query=normalized_payload.query,
                papers=ranked_results,
            )
            if ranked_results
            else self._build_empty_synthesis(provider_reports)
        )

        return SearchResponse(
            query=normalized_payload.query,
            results=ranked_results,
            synthesis=synthesis,
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
        items: list[SearchResultItem] = []
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
            items.extend(result.items)

        return items, reports

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

    def _build_empty_synthesis(
        self,
        provider_reports: Sequence[ProviderReport],
    ) -> SearchSynthesis:
        error_sources = [report.source for report in provider_reports if report.status != "ok"]
        summary = (
            "No results were returned from the selected providers. "
            "Grounded synthesis needs retrieved papers before it can generate a summary."
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

