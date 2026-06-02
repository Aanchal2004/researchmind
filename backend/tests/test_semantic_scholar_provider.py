from __future__ import annotations

import httpx
import pytest

from app.providers.search.semantic_scholar import SemanticScholarSearchProvider
from app.schemas.search import SearchRequest

SEMANTIC_SCHOLAR_RESPONSE = """{
  "total": 2,
  "offset": 0,
  "next": 2,
  "data": [
    {
      "paperId": "paper-1",
      "title": "Transformer models: an introduction and catalog",
      "abstract": "A catalog of transformer papers.",
      "year": 2023,
      "venue": "ACL",
      "url": "https://www.semanticscholar.org/paper/paper-1",
      "authors": [{"name": "Alice"}, {"name": "Bob"}],
      "externalIds": {"DOI": "10.1000/xyz"},
      "openAccessPdf": {"url": "https://example.org/paper-1.pdf"},
      "isOpenAccess": true,
      "fieldsOfStudy": ["Computer Science", "Artificial Intelligence"]
    }
  ]
}"""


@pytest.mark.asyncio
async def test_semantic_scholar_provider_normalizes_search_response() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(200, text=SEMANTIC_SCHOLAR_RESPONSE))
    async with httpx.AsyncClient(transport=transport) as client:
        provider = SemanticScholarSearchProvider(
            http_client=client,
            base_url="https://api.semanticscholar.org/graph/v1/paper/search",
            api_key="test-key",
            max_results_per_request=10,
            retry_attempts=1,
            retry_backoff_seconds=0.0,
            retry_jitter_seconds=0.0,
            request_timeout_seconds=5.0,
            total_budget_seconds=5.0,
            min_interval_seconds=0.0,
        )

        result = await provider.search(SearchRequest(query="transformer models", limit=3))

    assert len(result.items) == 1
    item = result.items[0]
    assert item.paper_id == "semantic_scholar:paper-1"
    assert item.source == "Semantic Scholar"
    assert item.doi == "10.1000/xyz"
    assert item.pdf_url == "https://example.org/paper-1.pdf"
    assert item.tags == ["Computer Science", "Artificial Intelligence"]
    assert result.report.status == "ok"
    assert result.report.total_results == 2
    assert result.report.next_page == 2


@pytest.mark.asyncio
async def test_semantic_scholar_provider_reports_rate_limit_errors() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            429,
            json={"message": "Too Many Requests", "code": "429"},
            headers={"Retry-After": "0"},
        )

    transport = httpx.MockTransport(
        handler
    )
    async with httpx.AsyncClient(transport=transport) as client:
        provider = SemanticScholarSearchProvider(
            http_client=client,
            base_url="https://api.semanticscholar.org/graph/v1/paper/search",
            api_key=None,
            max_results_per_request=10,
            retry_attempts=3,
            retry_backoff_seconds=0.0,
            retry_jitter_seconds=0.0,
            request_timeout_seconds=5.0,
            total_budget_seconds=5.0,
            min_interval_seconds=0.0,
        )

        result = await provider.search(SearchRequest(query="transformer models", limit=3))

    assert result.items == []
    assert result.report.status == "error"
    assert result.report.errors[0].code == "rate_limited"
    assert result.report.errors[0].retryable is False
    assert "API key" in result.report.errors[0].message
    assert len(requests) == 1
