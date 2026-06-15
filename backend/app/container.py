from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.core.config import Settings
from app.providers.search.arxiv import ArxivSearchProvider
from app.providers.search.base import SearchProvider
from app.providers.search.crossref import CrossrefSearchProvider
from app.providers.search.pubmed import PubMedSearchProvider
from app.providers.search.semantic_scholar import SemanticScholarSearchProvider
from app.providers.search.stub import StubSearchProvider
from app.providers.search.unpaywall import UnpaywallEnricher
from app.services.llm_synthesis import LLMSynthesisService
from app.services.ollama_synthesis import OllamaSynthesisService
from app.services.search import SearchService, SynthesisProtocol
from app.services.synthesis import SynthesisService


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
                retry_jitter_seconds=settings.semantic_scholar_retry_jitter_seconds,
                request_timeout_seconds=settings.semantic_scholar_request_timeout_seconds,
                total_budget_seconds=settings.semantic_scholar_total_budget_seconds,
                min_interval_seconds=settings.semantic_scholar_min_interval_seconds,
            )
        )

    if settings.pubmed_enabled:
        providers.append(
            PubMedSearchProvider(
                http_client=http_client,
                api_key=settings.pubmed_api_key,
                max_results_per_request=settings.pubmed_max_results_per_request,
                retry_attempts=settings.pubmed_retry_attempts,
                retry_backoff_seconds=settings.pubmed_retry_backoff_seconds,
                retry_jitter_seconds=settings.pubmed_retry_jitter_seconds,
                request_timeout_seconds=settings.pubmed_request_timeout_seconds,
                total_budget_seconds=settings.pubmed_total_budget_seconds,
                min_interval_seconds=settings.pubmed_min_interval_seconds,
            )
        )

    if settings.crossref_enabled:
        providers.append(
            CrossrefSearchProvider(
                http_client=http_client,
                mailto=settings.crossref_mailto,
                max_results_per_request=settings.crossref_max_results_per_request,
                retry_attempts=settings.crossref_retry_attempts,
                retry_backoff_seconds=settings.crossref_retry_backoff_seconds,
                retry_jitter_seconds=settings.crossref_retry_jitter_seconds,
                request_timeout_seconds=settings.crossref_request_timeout_seconds,
                total_budget_seconds=settings.crossref_total_budget_seconds,
                min_interval_seconds=settings.crossref_min_interval_seconds,
            )
        )

    if settings.search_use_stub_provider:
        providers.append(StubSearchProvider())

    unpaywall = (
        UnpaywallEnricher(
            http_client=http_client,
            email=settings.unpaywall_email,
            request_timeout_seconds=settings.unpaywall_request_timeout_seconds,
            min_interval_seconds=settings.unpaywall_min_interval_seconds,
            max_concurrent=settings.unpaywall_max_concurrent,
        )
        if settings.unpaywall_enabled
        else None
    )

    extractive_synthesis = SynthesisService(
        enabled=settings.synthesis_enabled,
        max_papers=settings.synthesis_max_papers,
        max_abstract_chars=settings.synthesis_max_abstract_chars,
    )

    # Ollama is always built when config is present so it can serve as a
    # secondary fallback behind Gemini.
    ollama_synthesis = OllamaSynthesisService(
        base_url=settings.llm_ollama_base_url,
        model=settings.llm_ollama_model,
        request_timeout_seconds=settings.llm_request_timeout_seconds,
        cache_ttl_seconds=settings.llm_synthesis_cache_ttl_seconds,
        extractive_fallback=extractive_synthesis,
    )

    synthesis: SynthesisProtocol
    if settings.llm_provider == "gemini" and settings.llm_gemini_api_key:
        # Chain: Gemini → Ollama → Extractive
        synthesis = LLMSynthesisService(
            gemini_api_key=settings.llm_gemini_api_key,
            model=settings.llm_gemini_model,
            temperature=settings.llm_temperature,
            max_output_tokens=settings.llm_max_output_tokens,
            request_timeout_seconds=settings.llm_request_timeout_seconds,
            cache_ttl_seconds=settings.llm_synthesis_cache_ttl_seconds,
            extractive_fallback=extractive_synthesis,
            secondary_fallback=ollama_synthesis,
        )
    elif settings.llm_provider == "ollama":
        # Chain: Ollama → Extractive
        synthesis = ollama_synthesis
    else:
        synthesis = extractive_synthesis

    search_service = SearchService(
        providers=providers,
        default_limit=settings.search_default_limit,
        max_limit=settings.search_max_limit,
        synthesis_service=synthesis,
        unpaywall_enricher=unpaywall,
    )

    return ApplicationContainer(
        settings=settings,
        http_client=http_client,
        search_service=search_service,
    )
