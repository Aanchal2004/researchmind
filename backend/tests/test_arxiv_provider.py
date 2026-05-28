from __future__ import annotations

import httpx
import pytest

from app.providers.search.arxiv import ArxivSearchProvider
from app.schemas.search import SearchRequest

ARXIV_RESPONSE = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/"
      xmlns:arxiv="http://arxiv.org/schemas/atom">
  <opensearch:totalResults>1</opensearch:totalResults>
  <entry>
    <id>http://arxiv.org/abs/2501.12345v1</id>
    <updated>2026-01-15T00:00:00Z</updated>
    <published>2026-01-14T00:00:00Z</published>
    <title> Diffusion Models for Research Workflows </title>
    <summary> A normalized abstract for provider parsing. </summary>
    <author><name>Jane Doe</name></author>
    <author><name>John Smith</name></author>
    <link href="http://arxiv.org/abs/2501.12345v1" rel="alternate" type="text/html" />
    <link title="pdf" href="http://arxiv.org/pdf/2501.12345v1" rel="related" type="application/pdf" />
    <arxiv:primary_category term="cs.AI" scheme="http://arxiv.org/schemas/atom" />
    <category term="cs.AI" scheme="http://arxiv.org/schemas/atom" />
    <category term="cs.LG" scheme="http://arxiv.org/schemas/atom" />
    <arxiv:doi>10.1000/test-doi</arxiv:doi>
    <arxiv:journal_ref>Test Journal (2026)</arxiv:journal_ref>
  </entry>
</feed>
"""


@pytest.mark.asyncio
async def test_arxiv_provider_normalizes_atom_feed() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(200, text=ARXIV_RESPONSE))
    async with httpx.AsyncClient(transport=transport) as client:
        provider = ArxivSearchProvider(
            http_client=client,
            base_url="https://export.arxiv.org/api/query",
            max_results_per_request=5,
            page_size=5,
            retry_attempts=1,
            retry_backoff_seconds=0.0,
            retry_jitter_seconds=0.0,
            request_timeout_seconds=5.0,
            total_budget_seconds=5.0,
            min_interval_seconds=0.0,
            cache_ttl_seconds=0.0,
            circuit_breaker_threshold=3,
            circuit_breaker_open_seconds=30.0,
            max_concurrent_requests=1,
            sort_by="relevance",
            sort_order="descending",
        )

        result = await provider.search(SearchRequest(query="diffusion models", limit=3))

    assert len(result.items) == 1
    item = result.items[0]
    assert item.paper_id == "arxiv:2501.12345v1"
    assert item.source == "arXiv"
    assert item.authors == ["Jane Doe", "John Smith"]
    assert item.doi == "10.1000/test-doi"
    assert item.venue == "Test Journal (2026)"
    assert item.open_access is True
    assert item.tags[:2] == ["cs.AI", "cs.LG"]
    assert result.report.status == "ok"
    assert result.report.total_results == 1


@pytest.mark.asyncio
async def test_arxiv_provider_returns_empty_results_on_timeout() -> None:
    def raise_timeout(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out")

    transport = httpx.MockTransport(raise_timeout)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = ArxivSearchProvider(
            http_client=client,
            base_url="https://export.arxiv.org/api/query",
            max_results_per_request=5,
            page_size=5,
            retry_attempts=1,
            retry_backoff_seconds=0.0,
            retry_jitter_seconds=0.0,
            request_timeout_seconds=0.01,
            total_budget_seconds=0.5,
            min_interval_seconds=0.0,
            cache_ttl_seconds=0.0,
            circuit_breaker_threshold=3,
            circuit_breaker_open_seconds=30.0,
            max_concurrent_requests=1,
            sort_by="relevance",
            sort_order="descending",
        )

        result = await provider.search(SearchRequest(query="diffusion models", limit=3))

    assert result.items == []
    assert result.report.status == "error"
    assert result.report.errors[0].code == "timeout"


@pytest.mark.asyncio
async def test_arxiv_provider_returns_partial_results_when_later_page_fails() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if "start=0" in str(request.url):
            return httpx.Response(200, text=ARXIV_RESPONSE)
        raise httpx.ReadTimeout("timed out")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = ArxivSearchProvider(
            http_client=client,
            base_url="https://export.arxiv.org/api/query",
            max_results_per_request=8,
            page_size=1,
            retry_attempts=1,
            retry_backoff_seconds=0.0,
            retry_jitter_seconds=0.0,
            request_timeout_seconds=5.0,
            total_budget_seconds=5.0,
            min_interval_seconds=0.0,
            cache_ttl_seconds=0.0,
            circuit_breaker_threshold=3,
            circuit_breaker_open_seconds=30.0,
            max_concurrent_requests=1,
            sort_by="relevance",
            sort_order="descending",
        )

        result = await provider.search(SearchRequest(query="diffusion models", limit=2))

    assert len(result.items) == 1
    assert result.report.status == "partial"
    assert result.report.errors[0].code == "timeout"
    assert len(requests) == 2


@pytest.mark.asyncio
async def test_arxiv_provider_does_not_retry_on_429() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(429, text="too many requests")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = ArxivSearchProvider(
            http_client=client,
            base_url="https://export.arxiv.org/api/query",
            max_results_per_request=5,
            page_size=5,
            retry_attempts=2,
            retry_backoff_seconds=0.0,
            retry_jitter_seconds=0.0,
            request_timeout_seconds=5.0,
            total_budget_seconds=5.0,
            min_interval_seconds=0.0,
            cache_ttl_seconds=0.0,
            circuit_breaker_threshold=3,
            circuit_breaker_open_seconds=30.0,
            max_concurrent_requests=1,
            sort_by="relevance",
            sort_order="descending",
        )

        result = await provider.search(SearchRequest(query="diffusion models", limit=3))

    assert result.items == []
    assert result.report.errors[0].code == "rate_limited"
    assert len(requests) == 1


@pytest.mark.asyncio
async def test_arxiv_provider_caches_repeated_queries() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, text=ARXIV_RESPONSE)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = ArxivSearchProvider(
            http_client=client,
            base_url="https://export.arxiv.org/api/query",
            max_results_per_request=5,
            page_size=5,
            retry_attempts=1,
            retry_backoff_seconds=0.0,
            retry_jitter_seconds=0.0,
            request_timeout_seconds=5.0,
            total_budget_seconds=5.0,
            min_interval_seconds=0.0,
            cache_ttl_seconds=60.0,
            circuit_breaker_threshold=3,
            circuit_breaker_open_seconds=30.0,
            max_concurrent_requests=1,
            sort_by="relevance",
            sort_order="descending",
        )

        first = await provider.search(SearchRequest(query="diffusion models", limit=3))
        second = await provider.search(SearchRequest(query="diffusion models", limit=3))

    assert len(first.items) == 1
    assert len(second.items) == 1
    assert second.report.query_strategy.endswith("_cache")
    assert len(requests) == 1
