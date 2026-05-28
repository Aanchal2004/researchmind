from __future__ import annotations

from time import perf_counter

from app.providers.search.base import SearchProviderResult
from app.schemas.search import ProviderReport, SearchRequest, SearchResultItem


class StubSearchProvider:
    source_name = "stub"

    async def search(self, payload: SearchRequest) -> SearchProviderResult:
        started_at = perf_counter()
        topic = payload.query.strip()
        if not topic:
            return SearchProviderResult(
                items=[],
                report=ProviderReport(
                    source=self.source_name,
                    status="ok",
                    query_strategy="stub",
                    page=payload.page,
                    requested_limit=payload.limit,
                    served_count=0,
                    total_results=0,
                    latency_ms=round((perf_counter() - started_at) * 1000, 2),
                ),
            )

        items = [
            SearchResultItem(
                paper_id="stub-targetdiff",
                title=f"Scaffolded search result for '{topic}'",
                authors=["ResearchMind Team"],
                year=2026,
                venue="Backend scaffold dataset",
                source="stub",
                abstract=(
                    "This placeholder result proves the request/response contract, "
                    "service boundary, and frontend wiring before live scholarly "
                    "providers are integrated."
                ),
                score=0.91,
                doi=None,
                url="https://example.com/researchmind/scaffold-result",
                pdf_url=None,
                open_access=True,
                tags=["scaffold", "backend-foundation"],
            )
        ]
        return SearchProviderResult(
            items=items,
            report=ProviderReport(
                source=self.source_name,
                status="ok",
                query_strategy="stub",
                page=payload.page,
                requested_limit=payload.limit,
                served_count=len(items),
                total_results=len(items),
                latency_ms=round((perf_counter() - started_at) * 1000, 2),
            ),
        )
