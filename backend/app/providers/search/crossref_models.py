from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CrossrefAuthor(BaseModel):
    model_config = ConfigDict(extra="ignore")

    given: str | None = None
    family: str | None = None
    name: str | None = None  # Organization author

    def display_name(self) -> str:
        if self.given and self.family:
            return f"{self.family}, {self.given}"
        return self.family or self.given or self.name or "Unknown"


class CrossrefDate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    date_parts: list[list[int | None]] = Field(default_factory=list, alias="date-parts")

    def year(self) -> int | None:
        try:
            return int(self.date_parts[0][0]) if self.date_parts and self.date_parts[0] else None
        except (IndexError, TypeError, ValueError):
            return None


class CrossrefWork(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    DOI: str | None = None
    title: list[str] = Field(default_factory=list)
    author: list[CrossrefAuthor] = Field(default_factory=list)
    published: CrossrefDate | None = None
    published_print: CrossrefDate | None = Field(None, alias="published-print")
    published_online: CrossrefDate | None = Field(None, alias="published-online")
    container_title: list[str] = Field(default_factory=list, alias="container-title")
    abstract: str | None = None
    URL: str | None = None
    type: str | None = None
    score: float | None = None
    is_referenced_by_count: int | None = Field(None, alias="is-referenced-by-count")
    subject: list[str] = Field(default_factory=list)

    def primary_title(self) -> str:
        return self.title[0] if self.title else ""

    def venue(self) -> str | None:
        return self.container_title[0] if self.container_title else None

    def year(self) -> int | None:
        for date_field in (self.published, self.published_print, self.published_online):
            if date_field:
                y = date_field.year()
                if y:
                    return y
        return None


class CrossrefSearchMessage(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    total_results: int | None = Field(None, alias="total-results")
    items: list[CrossrefWork] = Field(default_factory=list)
    items_per_page: int | None = Field(None, alias="items-per-page")
    query: dict[str, object] | None = None


class CrossrefSearchResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: str | None = None
    message: CrossrefSearchMessage | None = None
