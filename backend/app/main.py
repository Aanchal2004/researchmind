from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.container import ApplicationContainer, build_container
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging


def build_lifespan(settings: Settings):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        configure_logging(settings)

        container = build_container(settings)
        app.state.container = container

        logger = logging.getLogger("researchmind.startup")
        logger.info("starting application", extra={"environment": settings.app_env})

        try:
            yield
        finally:
            await container.close()
            logger.info("application shutdown complete")

    return lifespan


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()

    application = FastAPI(
        title=app_settings.app_name,
        version=app_settings.app_version,
        debug=app_settings.debug,
        lifespan=build_lifespan(app_settings),
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def request_logging_middleware(request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id

        started_at = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

        logging.getLogger("researchmind.http").info(
            "%s %s -> %s",
            request.method,
            request.url.path,
            response.status_code,
            extra={"duration_ms": duration_ms, "request_id": request_id},
        )
        response.headers["x-request-id"] = request_id
        return response

    application.include_router(api_router, prefix=app_settings.api_prefix)
    return application


app = create_app()
