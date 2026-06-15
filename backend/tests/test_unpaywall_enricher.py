from __future__ import annotations

import httpx
import pytest

from app.providers.search.unpaywall import UnpaywallEnricher
from app.schemas.search import SearchResultItem


def _make_item(paper_id: str, doi: str | None = None, pdf_url: str | None = None) -> SearchResultItem:
    return SearchResultItem(
        paper_id=paper_id,
        title="Test Paper",
        authors=["Author A"],
        year=2023,
        venue="Test Journal",
        source="Test",
        abstract=None,
        score=None,
        doi=doi,
        url=f"https://example.org/{paper_id}",
        pdf_url=pdf_url,
        open_access=pdf_url is not None,
        tags=[],
    )


UNPAYWALL_FOUND = """{
  "doi": "10.1000/test",
  "is_oa": true,
  "best_oa_location": {
    "url_for_pdf": "https://example.org/test.pdf",
    "url": "https://example.org/test"
  }
}"""

UNPAYWALL_NOT_OA = """{
  "doi": "10.1000/closed",
  "is_oa": false,
  "best_oa_location": null
}"""


@pytest.mark.asyncio
async def test_unpaywall_enricher_attaches_pdf_url() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if "10.1000/test" in str(request.url):
            return httpx.Response(200, text=UNPAYWALL_FOUND)
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        enricher = UnpaywallEnricher(
            http_client=client,
            email="test@example.com",
            request_timeout_seconds=5.0,
            min_interval_seconds=0.0,
        )
        items = [_make_item("test:1", doi="10.1000/test")]
        enriched = await enricher.enrich(items)

    assert enriched[0].pdf_url == "https://example.org/test.pdf"
    assert enriched[0].open_access is True


@pytest.mark.asyncio
async def test_unpaywall_enricher_skips_items_without_doi() -> None:
    transport = httpx.MockTransport(lambda _: httpx.Response(200, text=UNPAYWALL_FOUND))
    async with httpx.AsyncClient(transport=transport) as client:
        enricher = UnpaywallEnricher(
            http_client=client, email="test@example.com", min_interval_seconds=0.0
        )
        items = [_make_item("test:2", doi=None)]
        enriched = await enricher.enrich(items)

    assert enriched[0].pdf_url is None


@pytest.mark.asyncio
async def test_unpaywall_enricher_skips_items_with_existing_pdf() -> None:
    called = [False]

    def handler(_: httpx.Request) -> httpx.Response:
        called[0] = True
        return httpx.Response(200, text=UNPAYWALL_FOUND)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        enricher = UnpaywallEnricher(
            http_client=client, email="test@example.com", min_interval_seconds=0.0
        )
        items = [_make_item("test:3", doi="10.1000/test", pdf_url="https://already.com/paper.pdf")]
        await enricher.enrich(items)

    assert not called[0]


@pytest.mark.asyncio
async def test_unpaywall_enricher_handles_closed_access() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if "10.1000/closed" in str(request.url):
            return httpx.Response(200, text=UNPAYWALL_NOT_OA)
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        enricher = UnpaywallEnricher(
            http_client=client, email="test@example.com", min_interval_seconds=0.0
        )
        items = [_make_item("test:4", doi="10.1000/closed")]
        enriched = await enricher.enrich(items)

    assert enriched[0].pdf_url is None
    assert enriched[0].open_access is False


@pytest.mark.asyncio
async def test_unpaywall_enricher_continues_on_network_error() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Network unreachable")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        enricher = UnpaywallEnricher(
            http_client=client, email="test@example.com", min_interval_seconds=0.0
        )
        items = [_make_item("test:5", doi="10.1000/any")]
        enriched = await enricher.enrich(items)

    # Should return original item unchanged on error.
    assert enriched[0].pdf_url is None
