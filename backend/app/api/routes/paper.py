from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_search_service
from app.schemas.search import SearchFilters, SearchRequest, SearchResultItem
from app.services.search import SearchService

router = APIRouter()

_DEFAULT_FILTERS = SearchFilters(
    sources=[],
    year_from=None,
    year_to=None,
    open_access_only=False,
)


@router.get(
    "/paper/{paper_id:path}",
    response_model=SearchResultItem,
    summary="Look up a single paper by its provider-namespaced ID",
)
async def get_paper(
    paper_id: str,
    service: SearchService = Depends(get_search_service),
) -> SearchResultItem:
    """
    Resolve a paper by its provider-namespaced ID (e.g. ``arxiv:2210.03621``,
    ``pubmed:12345678``, ``crossref:10.1145/…``).

    The implementation performs a targeted search using the ID as the query
    and returns the first result whose ``paper_id`` matches exactly.  This
    avoids needing a separate per-provider lookup API at the cost of one
    extra network round-trip.
    """
    # Strip the provider prefix to use as the search query fallback.
    query_hint = _extract_query_hint(paper_id)

    payload = SearchRequest(
        query=query_hint,
        page=1,
        limit=10,
        filters=_DEFAULT_FILTERS,
    )

    response = await service.search(payload)

    # Exact match on paper_id first.
    for result in response.results:
        if result.paper_id == paper_id:
            return result

    # Loose match — accept if the raw ID suffix appears in any paper_id.
    raw_id = paper_id.split(":", 1)[-1] if ":" in paper_id else paper_id
    for result in response.results:
        if raw_id in result.paper_id:
            return result

    raise HTTPException(
        status_code=404,
        detail=f"Paper '{paper_id}' not found. It may not be indexed or the provider may be disabled.",
    )


def _extract_query_hint(paper_id: str) -> str:
    """Turn a namespaced ID into the best search query we can construct."""
    if ":" not in paper_id:
        return paper_id

    prefix, raw = paper_id.split(":", 1)

    # arXiv IDs like 2210.03621 — search directly
    if prefix == "arxiv":
        return raw

    # DOI — use the DOI as the query (Crossref handles this well)
    if prefix in ("crossref", "doi"):
        return raw

    # PubMed / Semantic Scholar — use the numeric/hash ID
    return raw
