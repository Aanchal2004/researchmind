from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from difflib import SequenceMatcher
import re

from app.schemas.search import SearchResultItem


_WORD_PATTERN = re.compile(r"[a-z0-9]+")


@dataclass(frozen=True)
class RankingWeights:
    title_match: float = 0.45
    provider_score: float = 0.25
    recency: float = 0.15
    source_confirmation: float = 0.10
    quality: float = 0.05


class SearchResultMerger:
    """Deterministic multi-provider dedupe and ranking.

    This intentionally avoids semantic reranking. The goal is an explainable
    retrieval-quality layer that can sit between provider adapters and future
    synthesis/orchestration without coupling either side together.
    """

    def __init__(
        self,
        *,
        title_similarity_threshold: float = 0.92,
        weights: RankingWeights | None = None,
    ) -> None:
        self.title_similarity_threshold = title_similarity_threshold
        self.weights = weights or RankingWeights()

    def merge_and_rank(
        self,
        results: Sequence[SearchResultItem],
        *,
        query: str,
    ) -> list[SearchResultItem]:
        merged = self.merge(results)
        return sorted(
            merged,
            key=lambda item: self._ranking_key(item, query=query),
            reverse=True,
        )

    def merge(self, results: Sequence[SearchResultItem]) -> list[SearchResultItem]:
        doi_groups: dict[str, SearchResultItem] = {}
        title_groups: list[SearchResultItem] = []

        for item in results:
            doi_key = self._normalize_doi(item.doi)
            if doi_key:
                if doi_key in doi_groups:
                    doi_groups[doi_key] = self._merge_items(doi_groups[doi_key], item)
                else:
                    doi_groups[doi_key] = self._ensure_provider_attribution(item)
                continue

            match_index = self._find_title_match_index(title_groups, item)
            if match_index is None:
                title_groups.append(self._ensure_provider_attribution(item))
                continue

            title_groups[match_index] = self._merge_items(title_groups[match_index], item)

        # DOI matches are authoritative, but title-only items can still be the
        # same paper as a DOI-bearing item from another provider.
        merged_items = list(doi_groups.values())
        for title_item in title_groups:
            match_index = self._find_title_match_index(merged_items, title_item)
            if match_index is None:
                merged_items.append(title_item)
            else:
                merged_items[match_index] = self._merge_items(merged_items[match_index], title_item)

        return merged_items

    def _find_title_match_index(
        self,
        candidates: Sequence[SearchResultItem],
        item: SearchResultItem,
    ) -> int | None:
        normalized_title = self._normalize_title(item.title)
        if not normalized_title:
            return None

        for index, candidate in enumerate(candidates):
            if not self._years_compatible(candidate.year, item.year):
                continue

            candidate_title = self._normalize_title(candidate.title)
            if candidate_title == normalized_title:
                return index

            similarity = SequenceMatcher(None, candidate_title, normalized_title).ratio()
            if similarity >= self.title_similarity_threshold:
                return index

        return None

    def _merge_items(
        self,
        existing: SearchResultItem,
        incoming: SearchResultItem,
    ) -> SearchResultItem:
        preferred = self._choose_preferred_item(existing, incoming)
        secondary = incoming if preferred is existing else existing

        provider_sources = self._merge_unique(
            [*preferred.provider_sources, preferred.source, *secondary.provider_sources, secondary.source]
        )
        provider_ids = self._merge_unique(
            [*preferred.provider_ids, preferred.paper_id, *secondary.provider_ids, secondary.paper_id]
        )

        return preferred.model_copy(
            update={
                "authors": self._merge_unique([*preferred.authors, *secondary.authors]),
                "tags": self._merge_unique([*preferred.tags, *secondary.tags]),
                "abstract": self._choose_longer_text(preferred.abstract, secondary.abstract),
                "doi": preferred.doi or secondary.doi,
                "url": preferred.url or secondary.url,
                "pdf_url": preferred.pdf_url or secondary.pdf_url,
                "venue": preferred.venue or secondary.venue,
                "open_access": preferred.open_access or secondary.open_access,
                "score": max(preferred.score or 0.0, secondary.score or 0.0) or None,
                "provider_sources": provider_sources,
                "provider_ids": provider_ids,
            }
        )

    def _choose_preferred_item(
        self,
        existing: SearchResultItem,
        incoming: SearchResultItem,
    ) -> SearchResultItem:
        existing_quality = self._metadata_quality(existing)
        incoming_quality = self._metadata_quality(incoming)
        if incoming_quality > existing_quality:
            return incoming
        if existing_quality > incoming_quality:
            return existing

        existing_score = existing.score or 0.0
        incoming_score = incoming.score or 0.0
        return incoming if incoming_score > existing_score else existing

    def _ranking_key(self, item: SearchResultItem, *, query: str) -> tuple[float, int, str]:
        score = self._ranking_score(item, query=query)
        year = item.year or 0
        return (score, year, item.title.lower())

    def _ranking_score(self, item: SearchResultItem, *, query: str) -> float:
        provider_count = len(set(item.provider_sources or [item.source]))
        weighted_score = (
            self.weights.title_match * self._title_match_score(item.title, query)
            + self.weights.provider_score * (item.score or 0.0)
            + self.weights.recency * self._recency_score(item.year)
            + self.weights.source_confirmation * min(provider_count / 2, 1.0)
            + self.weights.quality * self._metadata_quality(item)
        )
        return round(weighted_score, 6)

    def _title_match_score(self, title: str, query: str) -> float:
        title_tokens = self._tokenize(title)
        query_tokens = self._tokenize(query)
        if not title_tokens or not query_tokens:
            return 0.0

        title_text = " ".join(title_tokens)
        query_text = " ".join(query_tokens)
        if title_text == query_text:
            return 1.0
        if query_text in title_text:
            return 0.92

        overlap = len(set(title_tokens) & set(query_tokens)) / len(set(query_tokens))
        similarity = SequenceMatcher(None, title_text, query_text).ratio()
        return max(overlap * 0.85, similarity * 0.65)

    def _recency_score(self, year: int | None) -> float:
        if year is None:
            return 0.35
        current_year = datetime.now(UTC).year
        if year >= current_year:
            return 1.0
        age = max(0, current_year - year)
        return max(0.0, 1 - (age / 20))

    def _metadata_quality(self, item: SearchResultItem) -> float:
        checks = [
            bool(item.abstract),
            bool(item.authors),
            bool(item.year),
            bool(item.url),
            bool(item.pdf_url),
            bool(item.doi),
            bool(item.venue),
        ]
        return sum(checks) / len(checks)

    def _ensure_provider_attribution(self, item: SearchResultItem) -> SearchResultItem:
        provider_sources = self._merge_unique([*item.provider_sources, item.source])
        provider_ids = self._merge_unique([*item.provider_ids, item.paper_id])
        return item.model_copy(update={"provider_sources": provider_sources, "provider_ids": provider_ids})

    def _normalize_doi(self, doi: str | None) -> str | None:
        if not doi:
            return None
        normalized = doi.strip().lower()
        normalized = normalized.removeprefix("https://doi.org/")
        normalized = normalized.removeprefix("http://doi.org/")
        normalized = normalized.removeprefix("doi:")
        return normalized or None

    def _normalize_title(self, title: str) -> str:
        return " ".join(self._tokenize(title))

    def _tokenize(self, value: str) -> list[str]:
        return _WORD_PATTERN.findall(value.lower())

    def _years_compatible(self, first: int | None, second: int | None) -> bool:
        if first is None or second is None:
            return True
        return abs(first - second) <= 1

    def _choose_longer_text(self, first: str | None, second: str | None) -> str | None:
        if not first:
            return second
        if not second:
            return first
        return second if len(second) > len(first) else first

    def _merge_unique(self, values: Sequence[str | None]) -> list[str]:
        return list(dict.fromkeys(value for value in values if value))
