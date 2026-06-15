from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class SearchFilters(BaseModel):
    sources: list[str] = Field(default_factory=list)
    year_from: int | None = Field(default=None, ge=1900)
    year_to: int | None = Field(default=None, ge=1900)
    open_access_only: bool = False


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    page: int = Field(default=1, ge=1, le=1000)
    limit: int = Field(default=10, ge=1, le=50)
    filters: SearchFilters = Field(default_factory=SearchFilters)

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("query must not be empty")
        return normalized


class SearchResultItem(BaseModel):
    paper_id: str
    title: str
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    venue: str | None = None
    source: str
    abstract: str | None = None
    score: float | None = Field(default=None, ge=0.0, le=1.0)
    doi: str | None = None
    url: str | None = None
    pdf_url: str | None = None
    open_access: bool = False
    tags: list[str] = Field(default_factory=list)
    provider_sources: list[str] = Field(default_factory=list)
    provider_ids: list[str] = Field(default_factory=list)


class SearchSynthesis(BaseModel):
    status: Literal["pending", "completed", "disabled", "failed"]
    summary: str
    highlights: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    model: str | None = None  # e.g. "llama3", "gemini-2.0-flash", or None for extractive


class SearchMeta(BaseModel):
    provider_reports: list["ProviderReport"] = Field(default_factory=list)
    page: int
    limit: int
    total_results: int | None = None
    next_page: int | None = None
    query_id: str
    mode: Literal["scaffold", "live"] = "scaffold"
    result_count: int
    provider_count: int
    sources_queried: list[str] = Field(default_factory=list)
    duration_ms: float
    generated_at: datetime


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem] = Field(default_factory=list)
    synthesis: SearchSynthesis
    meta: SearchMeta


class ProviderError(BaseModel):
    code: str
    message: str
    retryable: bool = False
    attempt: int | None = None


class ProviderReport(BaseModel):
    source: str
    status: Literal["ok", "partial", "error"]
    query_strategy: str
    page: int
    requested_limit: int
    served_count: int
    total_results: int | None = None
    next_page: int | None = None
    latency_ms: float
    errors: list[ProviderError] = Field(default_factory=list)
