from __future__ import annotations

from fastapi import Depends, Request

from app.container import ApplicationContainer
from app.core.config import Settings, get_settings
from app.services.search import SearchService


def get_app_settings() -> Settings:
    return get_settings()


def get_container(request: Request) -> ApplicationContainer:
    return request.app.state.container


def get_search_service(
    container: ApplicationContainer = Depends(get_container),
) -> SearchService:
    return container.search_service
