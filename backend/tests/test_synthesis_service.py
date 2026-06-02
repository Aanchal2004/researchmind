from __future__ import annotations

import pytest

from app.schemas.search import SearchResultItem
from app.services.synthesis import SynthesisService


def _paper(
    paper_id: str,
    title: str,
    abstract: str,
    *,
    score: float = 0.9,
) -> SearchResultItem:
    return SearchResultItem(
        paper_id=paper_id,
        title=title,
        authors=["Alice"],
        year=2024,
        venue="Test Venue",
        source="test",
        abstract=abstract,
        score=score,
        doi=None,
        url=f"https://example.org/{paper_id}",
        pdf_url=None,
        open_access=True,
        tags=["test"],
    )


@pytest.mark.asyncio
async def test_synthesis_service_generates_grounded_cited_output() -> None:
    service = SynthesisService(
        enabled=True,
        max_papers=2,
        max_abstract_chars=800,
    )
    papers = [
        _paper(
            "paper-1",
            "Transformer Models for Scientific Search",
            "Transformer models improve scientific search by matching queries with abstracts.",
        ),
        _paper(
            "paper-2",
            "Retrieval Pipelines for Literature Review",
            "Retrieval pipelines organize evidence before synthesis and citation generation.",
        ),
    ]

    synthesis = await service.synthesize(query="transformer retrieval", papers=papers)

    assert synthesis.status == "completed"
    assert "[1]" in synthesis.summary
    assert synthesis.sources == ["paper-1", "paper-2"]
    assert all(highlight.startswith(("[1]", "[2]")) for highlight in synthesis.highlights)


@pytest.mark.asyncio
async def test_synthesis_service_can_be_disabled() -> None:
    service = SynthesisService(
        enabled=False,
        max_papers=2,
        max_abstract_chars=800,
    )

    synthesis = await service.synthesize(
        query="transformer retrieval",
        papers=[
            _paper(
                "paper-1",
                "Transformer Models for Scientific Search",
                "Transformer models improve scientific search by matching queries with abstracts.",
            )
        ],
    )

    assert synthesis.status == "disabled"
    assert synthesis.sources == []
