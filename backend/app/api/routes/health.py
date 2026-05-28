from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from app.api.deps import get_app_settings
from app.core.config import Settings
from app.schemas.health import HealthResponse, HealthServiceStatus

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Service health check")
async def health_check(settings: Settings = Depends(get_app_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        timestamp=datetime.now(UTC),
        dependencies=[
            HealthServiceStatus(name="api", status="ok"),
            HealthServiceStatus(name="search_service", status="ready"),
        ],
    )
