from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class SemanticScholarAuthor(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None


class SemanticScholarExternalIds(BaseModel):
    model_config = ConfigDict(extra="allow")

    DOI: str | None = None


class SemanticScholarOpenAccessPdf(BaseModel):
    model_config = ConfigDict(extra="ignore")

    url: str | None = None


class SemanticScholarPaper(BaseModel):
    model_config = ConfigDict(extra="ignore")

    paperId: str
    title: str
    abstract: str | None = None
    year: int | None = None
    venue: str | None = None
    url: str | None = None
    authors: list[SemanticScholarAuthor] = Field(default_factory=list)
    externalIds: SemanticScholarExternalIds | None = None
    openAccessPdf: SemanticScholarOpenAccessPdf | None = None
    isOpenAccess: bool | None = None
    fieldsOfStudy: list[str] = Field(default_factory=list)


class SemanticScholarSearchResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    total: int | None = None
    offset: int = 0
    next: int | None = None
    data: list[SemanticScholarPaper] = Field(default_factory=list)
