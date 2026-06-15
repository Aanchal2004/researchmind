from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PubMedArticleId(BaseModel):
    model_config = ConfigDict(extra="ignore")

    idtype: str | None = None
    value: str | None = None


class PubMedAuthor(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None


class PubMedArticle(BaseModel):
    model_config = ConfigDict(extra="ignore")

    uid: str
    title: str | None = None
    sortfirstauthor: str | None = None
    authors: list[PubMedAuthor] = Field(default_factory=list)
    pubdate: str | None = None
    epubdate: str | None = None
    source: str | None = None
    volume: str | None = None
    issue: str | None = None
    pages: str | None = None
    lang: list[str] = Field(default_factory=list)
    articleids: list[PubMedArticleId] = Field(default_factory=list)
    fulljournalname: str | None = None
    elocationid: str | None = None
    attributes: list[str] = Field(default_factory=list)
    # Abstract is fetched separately via efetch and injected.
    abstract: str | None = None


class ESearchResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    count: str | None = None
    retmax: str | None = None
    retstart: str | None = None
    idlist: list[str] = Field(default_factory=list)


class ESearchResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    esearchresult: ESearchResult


class ESummaryDocsum(BaseModel):
    model_config = ConfigDict(extra="ignore")

    uids: list[str] = Field(default_factory=list)
    # Dynamically keyed by UID so we use dict access at runtime.


class ESummaryResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    result: dict[str, object] | None = None
