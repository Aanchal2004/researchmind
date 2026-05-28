from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_search_service
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search import SearchService

router = APIRouter()


@router.post("/search", response_model=SearchResponse, summary="Run a research search")
async def search(
    payload: SearchRequest,
    service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    return await service.search(payload)
