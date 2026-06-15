from __future__ import annotations

import httpx
import pytest

from app.providers.search.crossref import CrossrefSearchProvider
from app.schemas.search import SearchRequest

CROSSREF_RESPONSE = """{
  "status": "ok",
  "message": {
    "total-results": 100,
    "items-per-page": 2,
    "items": [
      {
        "DOI": "10.1145/3292500.3330968",
        "title": ["Attention Is All You Need"],
        "author": [
          {"given": "Ashish", "family": "Vaswani"},
          {"given": "Noam", "family": "Shazeer"}
        ],
        "published": {"date-parts": [[2017, 12, 4]]},
        "container-title": ["Advances in Neural Information Processing Systems"],
        "abstract": "<jats:p>We propose a new simple network architecture...</jats:p>",
        "URL": "https://doi.org/10.1145/3292500.3330968",
        "type": "proceedings-article",
        "score": 95.3,
        "is-referenced-by-count": 8000,
        "subject": ["Artificial Intelligence", "Machine Learning"]
      },
      {
        "DOI": "10.1000/noop",
        "title": [],
        "author": [],
        "published": {"date-parts": [[2020]]},
        "container-title": [],
        "URL": null,
        "type": "journal-article",
        "score": 10.1
      }
    ]
  }
}"""


def make_provider(client: httpx.AsyncClient) -> CrossrefSearchProvider:
    return CrossrefSearchProvider(
        http_client=client,
        mailto="test@researchmind.dev",
        max_results_per_request=10,
        retry_attempts=1,
        retry_backoff_seconds=0.0,
        retry_jitter_seconds=0.0,
        request_timeout_seconds=5.0,
        total_budget_seconds=10.0,
        min_interval_seconds=0.0,
    )


@pytest.mark.asyncio
async def test_crossref_provider_normalizes_works() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(200, text=CROSSREF_RESPONSE))
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="attention transformer", limit=5))

    # Only the item with a non-empty title is returned.
    assert len(result.items) == 1
    item = result.items[0]
    assert item.paper_id == "crossref:10.1145/3292500.3330968"
    assert item.source == "Crossref"
    assert item.doi == "10.1145/3292500.3330968"
    assert item.year == 2017
    assert item.venue == "Advances in Neural Information Processing Systems"
    # JATS tags should be stripped from abstract.
    assert "<jats:" not in (item.abstract or "")
    assert "new simple network" in (item.abstract or "")
    assert "artificial-intelligence" in item.tags
    assert result.report.status == "ok"
    assert result.report.total_results == 100


@pytest.mark.asyncio
async def test_crossref_provider_builds_correct_author_names() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(200, text=CROSSREF_RESPONSE))
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="anything", limit=5))

    authors = result.items[0].authors
    assert "Vaswani, Ashish" in authors
    assert "Shazeer, Noam" in authors


@pytest.mark.asyncio
async def test_crossref_provider_handles_http_error() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(503, text="Service Unavailable"))
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="anything", limit=5))

    assert result.items == []
    assert result.report.status == "error"
    assert result.report.errors[0].code == "http_status_error"


@pytest.mark.asyncio
async def test_crossref_provider_handles_404_non_retryable() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(404, text="Not Found"))
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="missing", limit=5))

    assert result.items == []
    assert result.report.errors[0].retryable is False
