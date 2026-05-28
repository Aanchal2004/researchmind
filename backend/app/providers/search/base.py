from __future__ import annotations

from dataclasses import dataclass
from collections.abc import Sequence
from typing import Protocol

from app.schemas.search import ProviderReport, SearchRequest, SearchResultItem


@dataclass(slots=True)
class SearchProviderResult:
    items: list[SearchResultItem]
    report: ProviderReport


class SearchProvider(Protocol):
    source_name: str

    async def search(self, payload: SearchRequest) -> SearchProviderResult:
        """Return normalized search results and provider diagnostics for one source."""
