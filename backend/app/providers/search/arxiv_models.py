from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ArxivLink(BaseModel):
    href: str
    rel: str | None = None
    title: str | None = None
    type: str | None = None


class ArxivEntry(BaseModel):
    entry_id: str
    title: str
    summary: str
    published: datetime | None = None
    updated: datetime | None = None
    authors: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    primary_category: str | None = None
    journal_ref: str | None = None
    doi: str | None = None
    comment: str | None = None
    links: list[ArxivLink] = Field(default_factory=list)


class ArxivFeed(BaseModel):
    total_results: int | None = None
    start_index: int | None = None
    items_per_page: int | None = None
    entries: list[ArxivEntry] = Field(default_factory=list)
