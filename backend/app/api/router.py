from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.chat import router as chat_router
from app.api.routes.health import router as health_router
from app.api.routes.library import router as library_router
from app.api.routes.paper import router as paper_router
from app.api.routes.search import router as search_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(search_router, tags=["search"])
api_router.include_router(paper_router, tags=["papers"])
api_router.include_router(chat_router, tags=["chat"])
api_router.include_router(auth_router)
api_router.include_router(library_router)
