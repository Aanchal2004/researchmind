from __future__ import annotations

import pytest

from app.providers.search.base import SearchProviderResult
from app.schemas.search import ProviderReport, SearchRequest, SearchResultItem
from app.services.search import SearchService


class StaticProvider:
    def __init__(self, source_name: str, items: list[SearchResultItem]) -> None:
        self.source_name = source_name
        self._items = items

    async def search(self, payload: SearchRequest) -> SearchProviderResult:
        return SearchProviderResult(
            items=self._items,
            report=ProviderReport(
                source=self.source_name,
                status="ok",
                query_strategy="test",
                page=payload.page,
                requested_limit=payload.limit,
                served_count=len(self._items),
                total_results=len(self._items),
                latency_ms=1.0,
            ),
        )


@pytest.mark.asyncio
async def test_search_service_deduplicates_across_providers_by_title_and_year() -> None:
    arxiv_item = SearchResultItem(
        paper_id="arxiv:abc",
        title="Transformer models: an introduction and catalog",
        authors=["Alice"],
        year=2023,
        venue="arXiv",
        source="arXiv",
        abstract="Abstract from arXiv.",
        score=0.9,
        doi=None,
        url="https://arxiv.org/abs/abc",
        pdf_url="https://arxiv.org/pdf/abc",
        open_access=True,
        tags=["cs.CL"],
    )
    s2_item = SearchResultItem(
        paper_id="semantic_scholar:def",
        title="Transformer models: an introduction and catalog",
        authors=["Alice", "Bob"],
        year=2023,
        venue="ACL",
        source="Semantic Scholar",
        abstract="Abstract from S2.",
        score=None,
        doi=None,
        url="https://semanticscholar.org/paper/def",
        pdf_url=None,
        open_access=False,
        tags=["Computer Science"],
    )

    service = SearchService(
        providers=[StaticProvider("arxiv", [arxiv_item]), StaticProvider("semantic_scholar", [s2_item])],
        default_limit=10,
        max_limit=25,
    )

    response = await service.search(SearchRequest(query="transformer models", limit=10))

    assert len(response.results) == 1
    assert response.results[0].authors == ["Alice", "Bob"]
    assert response.results[0].tags == ["cs.CL", "Computer Science"]
