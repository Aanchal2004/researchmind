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
    semantic_scholar_enabled: bool = False
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
    http_timeout_seconds: float = 10.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="RESEARCHMIND_",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
