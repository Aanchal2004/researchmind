from __future__ import annotations

import httpx
import pytest

from app.providers.search.pubmed import PubMedSearchProvider
from app.schemas.search import SearchRequest

ESEARCH_RESPONSE = """{
  "esearchresult": {
    "count": "2",
    "retmax": "2",
    "retstart": "0",
    "idlist": ["38000001", "38000002"]
  }
}"""

ESUMMARY_RESPONSE = """{
  "header": {},
  "result": {
    "uids": ["38000001", "38000002"],
    "38000001": {
      "uid": "38000001",
      "title": "Attention mechanisms in deep neural networks",
      "authors": [{"name": "Alice A"}, {"name": "Bob B"}],
      "pubdate": "2023 Jan",
      "source": "Nature",
      "fulljournalname": "Nature Reviews",
      "articleids": [
        {"idtype": "pubmed", "value": "38000001"},
        {"idtype": "doi", "value": "10.1038/test.2023.001"},
        {"idtype": "pmc", "value": "PMC1234567"}
      ]
    },
    "38000002": {
      "uid": "38000002",
      "title": "Large language models overview",
      "authors": [{"name": "Carol C"}],
      "pubdate": "2022 Jun",
      "source": "Science",
      "fulljournalname": "Science",
      "articleids": [
        {"idtype": "pubmed", "value": "38000002"},
        {"idtype": "doi", "value": "10.1126/science.2022.002"}
      ]
    }
  }
}"""

EFETCH_XML = b"""<?xml version="1.0" encoding="UTF-8"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>38000001</PMID>
      <Article>
        <Abstract>
          <AbstractText>This paper reviews attention mechanisms in deep networks.</AbstractText>
        </Abstract>
      </Article>
    </MedlineCitation>
  </PubmedArticle>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>38000002</PMID>
      <Article>
        <Abstract>
          <AbstractText>An overview of large language models and their capabilities.</AbstractText>
        </Abstract>
      </Article>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>"""


def make_handler():
    call_count = [0]

    def handler(request: httpx.Request) -> httpx.Response:
        call_count[0] += 1
        if "esearch" in str(request.url):
            return httpx.Response(200, text=ESEARCH_RESPONSE, headers={"Content-Type": "application/json"})
        if "esummary" in str(request.url):
            return httpx.Response(200, text=ESUMMARY_RESPONSE, headers={"Content-Type": "application/json"})
        if "efetch" in str(request.url):
            return httpx.Response(200, content=EFETCH_XML, headers={"Content-Type": "application/xml"})
        return httpx.Response(404)

    return handler


def make_provider(client: httpx.AsyncClient) -> PubMedSearchProvider:
    return PubMedSearchProvider(
        http_client=client,
        api_key=None,
        max_results_per_request=10,
        retry_attempts=1,
        retry_backoff_seconds=0.0,
        retry_jitter_seconds=0.0,
        request_timeout_seconds=5.0,
        total_budget_seconds=10.0,
        min_interval_seconds=0.0,
    )


@pytest.mark.asyncio
async def test_pubmed_provider_returns_normalized_items() -> None:
    transport = httpx.MockTransport(make_handler())
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="attention mechanisms", limit=5))

    assert len(result.items) == 2
    item = result.items[0]
    assert item.paper_id == "pubmed:38000001"
    assert item.source == "PubMed"
    assert item.doi == "10.1038/test.2023.001"
    assert item.open_access is True  # has PMC
    assert item.pdf_url is not None
    assert "PMC1234567" in (item.pdf_url or "")
    assert item.year == 2023
    assert result.report.status == "ok"
    assert result.report.total_results == 2


@pytest.mark.asyncio
async def test_pubmed_provider_attaches_abstracts_from_efetch() -> None:
    transport = httpx.MockTransport(make_handler())
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="LLMs", limit=5))

    abstracts = [item.abstract for item in result.items]
    assert any("attention" in (a or "").lower() for a in abstracts)
    assert any("large language" in (a or "").lower() for a in abstracts)


@pytest.mark.asyncio
async def test_pubmed_provider_handles_esearch_failure() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "internal server error"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="anything", limit=5))

    assert result.items == []
    assert result.report.status == "error"


@pytest.mark.asyncio
async def test_pubmed_provider_non_pmc_paper_not_open_access() -> None:
    transport = httpx.MockTransport(make_handler())
    async with httpx.AsyncClient(transport=transport) as client:
        provider = make_provider(client)
        result = await provider.search(SearchRequest(query="LLMs", limit=5))

    item2 = next(i for i in result.items if i.paper_id == "pubmed:38000002")
    assert item2.open_access is False
    assert item2.pdf_url is None
