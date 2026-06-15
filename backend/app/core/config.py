from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ResearchMind API"
    app_env: str = "local"
    app_version: str = "0.1.0"
    debug: bool = False
    api_prefix: str = "/api"
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        ]
    )
    log_level: str = "INFO"
    search_default_limit: int = 10
    search_max_limit: int = 25
    search_use_stub_provider: bool = False
    arxiv_enabled: bool = True
    arxiv_base_url: str = "https://export.arxiv.org/api/query"
    arxiv_max_results_per_request: int = 12
    arxiv_page_size: int = 4
    arxiv_retry_attempts: int = 2
    arxiv_retry_backoff_seconds: float = 1.0
    arxiv_retry_jitter_seconds: float = 0.5
    arxiv_request_timeout_seconds: float = 10.0
    arxiv_total_budget_seconds: float = 10.0
    arxiv_min_interval_seconds: float = 3.1
    arxiv_cache_ttl_seconds: float = 120.0
    arxiv_circuit_breaker_threshold: int = 3
    arxiv_circuit_breaker_open_seconds: float = 30.0
    arxiv_max_concurrent_requests: int = 1
    arxiv_sort_by: str = "relevance"
    arxiv_sort_order: str = "descending"
    semantic_scholar_enabled: bool = True
    semantic_scholar_api_key: str | None = None
    semantic_scholar_base_url: str = "https://api.semanticscholar.org/graph/v1/paper/search"
    semantic_scholar_max_results_per_request: int = 10
    semantic_scholar_retry_attempts: int = 2
    semantic_scholar_retry_backoff_seconds: float = 1.5
    semantic_scholar_retry_jitter_seconds: float = 0.5
    semantic_scholar_request_timeout_seconds: float = 12.0
    semantic_scholar_total_budget_seconds: float = 12.0
    semantic_scholar_min_interval_seconds: float = 1.1
    synthesis_enabled: bool = True
    synthesis_max_papers: int = 5
    synthesis_max_abstract_chars: int = 1200
    # LLM synthesis — set provider to "gemini", "ollama", or "disabled"
    llm_provider: str = "disabled"
    llm_gemini_api_key: str | None = None
    llm_gemini_model: str = "gemini-2.0-flash"
    llm_temperature: float = 0.2
    llm_max_output_tokens: int = 1024
    llm_request_timeout_seconds: float = 30.0
    llm_synthesis_cache_ttl_seconds: float = 300.0
    # Ollama (local) settings
    llm_ollama_base_url: str = "http://localhost:11434"
    llm_ollama_model: str = "llama3"
    http_timeout_seconds: float = 10.0
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""  # Settings → API → JWT Settings → JWT Secret
    # PubMed (NCBI E-utilities — free, no key required; key raises rate limit)
    pubmed_enabled: bool = True
    pubmed_api_key: str | None = None
    pubmed_max_results_per_request: int = 10
    pubmed_retry_attempts: int = 2
    pubmed_retry_backoff_seconds: float = 1.0
    pubmed_retry_jitter_seconds: float = 0.5
    pubmed_request_timeout_seconds: float = 12.0
    pubmed_total_budget_seconds: float = 14.0
    pubmed_min_interval_seconds: float = 0.34  # ~3 req/s without key; 10/s with key
    # Crossref (free, polite pool via mailto)
    crossref_enabled: bool = True
    crossref_mailto: str | None = None
    crossref_max_results_per_request: int = 10
    crossref_retry_attempts: int = 2
    crossref_retry_backoff_seconds: float = 1.0
    crossref_retry_jitter_seconds: float = 0.5
    crossref_request_timeout_seconds: float = 12.0
    crossref_total_budget_seconds: float = 14.0
    crossref_min_interval_seconds: float = 0.5
    # Unpaywall enricher (best-effort PDF resolution by DOI)
    unpaywall_enabled: bool = False
    unpaywall_email: str = "researchmind@example.com"
    unpaywall_request_timeout_seconds: float = 5.0
    unpaywall_min_interval_seconds: float = 0.2
    unpaywall_max_concurrent: int = 4

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="RESEARCHMIND_",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
