from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.core.config import Settings
from app.providers.search.arxiv import ArxivSearchProvider
from app.providers.search.base import SearchProvider
from app.providers.search.semantic_scholar import SemanticScholarSearchProvider
from app.providers.search.stub import StubSearchProvider
from app.services.search import SearchService


@dataclass(slots=True)
class ApplicationContainer:
    settings: Settings
    http_client: httpx.AsyncClient
    search_service: SearchService

    async def close(self) -> None:
        await self.http_client.aclose()


def build_container(settings: Settings) -> ApplicationContainer:
    http_client = httpx.AsyncClient(
        timeout=settings.http_timeout_seconds,
        headers={"User-Agent": f"{settings.app_name}/{settings.app_version}"},
        follow_redirects=True,
    )

    providers: list[SearchProvider] = []
    # Providers are composed in one place so routes stay unaware of which
    # external systems are enabled in a given environment.
    if settings.arxiv_enabled:
        providers.append(
            ArxivSearchProvider(
                http_client=http_client,
                base_url=settings.arxiv_base_url,
                max_results_per_request=settings.arxiv_max_results_per_request,
                page_size=settings.arxiv_page_size,
                retry_attempts=settings.arxiv_retry_attempts,
                retry_backoff_seconds=settings.arxiv_retry_backoff_seconds,
                retry_jitter_seconds=settings.arxiv_retry_jitter_seconds,
                request_timeout_seconds=settings.arxiv_request_timeout_seconds,
                total_budget_seconds=settings.arxiv_total_budget_seconds,
                min_interval_seconds=settings.arxiv_min_interval_seconds,
                cache_ttl_seconds=settings.arxiv_cache_ttl_seconds,
                circuit_breaker_threshold=settings.arxiv_circuit_breaker_threshold,
                circuit_breaker_open_seconds=settings.arxiv_circuit_breaker_open_seconds,
                max_concurrent_requests=settings.arxiv_max_concurrent_requests,
                sort_by=settings.arxiv_sort_by,
                sort_order=settings.arxiv_sort_order,
            )
        )
    if settings.semantic_scholar_enabled:
        providers.append(
            SemanticScholarSearchProvider(
                http_client=http_client,
                base_url=settings.semantic_scholar_base_url,
                api_key=settings.semantic_scholar_api_key,
                max_results_per_request=settings.semantic_scholar_max_results_per_request,
                retry_attempts=settings.semantic_scholar_retry_attempts,
                retry_backoff_seconds=settings.semantic_scholar_retry_backoff_seconds,
                request_timeout_seconds=settings.semantic_scholar_request_timeout_seconds,
                min_interval_seconds=settings.semantic_scholar_min_interval_seconds,
            )
        )
    if settings.search_use_stub_provider:
        providers.append(StubSearchProvider())

    search_service = SearchService(
        providers=providers,
        default_limit=settings.search_default_limit,
        max_limit=settings.search_max_limit,
    )

    return ApplicationContainer(
        settings=settings,
        http_client=http_client,
        search_service=search_service,
    )
