from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.api.deps import get_container
from app.container import ApplicationContainer
from app.schemas.search import SearchRequest, SearchResponse, SearchSynthesis
from app.services.synthesis_cache import synthesis_cache

router = APIRouter()
logger = logging.getLogger("researchmind.api.search")


@router.post("/search", response_model=SearchResponse, summary="Run a research search")
async def search(
    payload: SearchRequest,
    background_tasks: BackgroundTasks,
    container: ApplicationContainer = Depends(get_container),
) -> SearchResponse:
    """Return ranked results immediately; synthesis runs in the background.

    The response contains ``synthesis.status = "pending"``.
    Poll ``GET /api/synthesis/{query_id}`` (from ``meta.query_id``) until
    ``status`` becomes ``"completed"`` or ``"failed"``.
    """
    query_id = str(uuid4())

    # Retrieval + ranking — fast (~3-10 s). Synthesis intentionally skipped.
    response = await container.search_service.search(payload, query_id=query_id)

    if response.results:
        # Capture what we need; closures over mutable state are tricky.
        _query = response.query
        _papers = list(response.results)
        _service = container.search_service.synthesis_service

        async def _run_synthesis() -> None:
            try:
                result = await _service.synthesize(query=_query, papers=_papers)
                await synthesis_cache.set(query_id, result)
                logger.info("Background synthesis done query_id=%s model=%s", query_id, result.model)
            except Exception as exc:  # noqa: BLE001
                failed = SearchSynthesis(
                    status="failed",
                    summary="Synthesis failed — please retry.",
                    highlights=[],
                    sources=[],
                )
                await synthesis_cache.set(query_id, failed)
                logger.error("Background synthesis error query_id=%s: %s", query_id, exc)

        background_tasks.add_task(_run_synthesis)

    return response


@router.get(
    "/synthesis/{query_id}",
    response_model=SearchSynthesis,
    summary="Poll for async synthesis result",
)
async def get_synthesis(query_id: str) -> SearchSynthesis:
    """Returns synthesis once ready; 202 while still pending.

    Frontend should poll every 3 s until status != "pending".
    A 404 means the query_id is unknown or expired (TTL 10 min).
    """
    result = await synthesis_cache.get(query_id)
    if result is None:
        # Still running (not yet stored) — tell client to keep polling.
        raise HTTPException(status_code=202, detail="pending")
    return result
