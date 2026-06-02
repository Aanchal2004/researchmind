from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
import logging
import re

from app.schemas.search import SearchResultItem, SearchSynthesis


_SENTENCE_PATTERN = re.compile(r"(?<=[.!?])\s+")
_WORD_PATTERN = re.compile(r"[a-z0-9]+")


@dataclass(frozen=True)
class SynthesisContextPaper:
    citation_index: int
    paper_id: str
    title: str
    authors: list[str]
    year: int | None
    abstract: str | None


class SynthesisService:
    """Minimal grounded synthesis over normalized search results.

    This service is deliberately deterministic for now. It builds the same
    paper-grounded context a future LLM/agent can consume, then creates a
    concise extractive synthesis from titles and abstracts only.
    """

    def __init__(
        self,
        *,
        enabled: bool,
        max_papers: int,
        max_abstract_chars: int,
    ) -> None:
        self.enabled = enabled
        self.max_papers = max(1, max_papers)
        self.max_abstract_chars = max(200, max_abstract_chars)
        self.logger = logging.getLogger("researchmind.services.synthesis")

    async def synthesize(
        self,
        *,
        query: str,
        papers: Sequence[SearchResultItem],
    ) -> SearchSynthesis:
        if not self.enabled:
            return SearchSynthesis(
                status="disabled",
                summary="Grounded synthesis is disabled for this environment.",
                highlights=["Retrieval results are still available for manual review."],
                sources=[],
            )

        if not papers:
            return SearchSynthesis(
                status="pending",
                summary="No retrieved papers were available to synthesize.",
                highlights=["Run a broader search or inspect provider diagnostics for retrieval issues."],
                sources=[],
            )

        try:
            context_papers = self.build_context(papers)
            _ = self.build_prompt(query=query, papers=context_papers)
            return self._generate_extractive_synthesis(query=query, papers=context_papers)
        except Exception:
            self.logger.exception("grounded synthesis failed")
            return SearchSynthesis(
                status="failed",
                summary=(
                    "Synthesis could not be generated, but retrieval results remain available "
                    "with source metadata."
                ),
                highlights=["Retry the search or review the ranked paper list directly."],
                sources=[paper.paper_id for paper in papers[: self.max_papers]],
            )

    def build_context(self, papers: Sequence[SearchResultItem]) -> list[SynthesisContextPaper]:
        context: list[SynthesisContextPaper] = []
        for index, paper in enumerate(papers[: self.max_papers], start=1):
            context.append(
                SynthesisContextPaper(
                    citation_index=index,
                    paper_id=paper.paper_id,
                    title=paper.title,
                    authors=paper.authors[:6],
                    year=paper.year,
                    abstract=self._truncate(paper.abstract, self.max_abstract_chars),
                )
            )
        return context

    def build_prompt(self, *, query: str, papers: Sequence[SynthesisContextPaper]) -> str:
        paper_blocks = "\n\n".join(
            (
                f"[{paper.citation_index}] {paper.title}\n"
                f"Year: {paper.year or 'unknown'}\n"
                f"Authors: {', '.join(paper.authors) or 'unknown'}\n"
                f"Abstract: {paper.abstract or 'No abstract available.'}"
            )
            for paper in papers
        )
        return (
            "You are ResearchMind's grounded synthesis layer.\n"
            "Use only the paper titles and abstracts below.\n"
            "Cite every claim with bracketed source numbers like [1].\n"
            "If the evidence is insufficient, say so plainly.\n\n"
            f"Research query: {query}\n\n"
            f"Retrieved papers:\n{paper_blocks}\n\n"
            "Write a concise synthesis and 3 grounded takeaways."
        )

    def _generate_extractive_synthesis(
        self,
        *,
        query: str,
        papers: Sequence[SynthesisContextPaper],
    ) -> SearchSynthesis:
        cited_papers = list(papers[: min(3, len(papers))])
        lead = self._build_lead_sentence(query=query, papers=cited_papers)
        evidence = self._build_evidence_sentence(query=query, papers=cited_papers)
        summary = f"{lead} {evidence}"

        highlights = [
            self._build_focus_highlight(paper, query=query)
            for paper in cited_papers
        ]
        if len(papers) > len(cited_papers):
            highlights.append(
                f"Additional ranked papers are available for review beyond the top {len(cited_papers)} cited sources."
            )

        return SearchSynthesis(
            status="completed",
            summary=summary,
            highlights=highlights,
            sources=[paper.paper_id for paper in cited_papers],
        )

    def _build_lead_sentence(
        self,
        *,
        query: str,
        papers: Sequence[SynthesisContextPaper],
    ) -> str:
        citations = self._format_citations(papers)
        if len(papers) == 1:
            return f"For '{query}', the top retrieved paper focuses on {papers[0].title} {citations}."

        titles = "; ".join(paper.title for paper in papers[:2])
        return f"For '{query}', the top retrieved papers center on {titles} {citations}."

    def _build_evidence_sentence(
        self,
        *,
        query: str,
        papers: Sequence[SynthesisContextPaper],
    ) -> str:
        cited_fragments: list[str] = []
        for paper in papers:
            fragment = self._select_grounded_sentence(paper, query=query)
            if fragment:
                cited_fragments.append(f"{fragment} [{paper.citation_index}]")

        if not cited_fragments:
            return "The available evidence is limited to titles because abstracts were not returned."

        return " ".join(cited_fragments[:3])

    def _build_focus_highlight(self, paper: SynthesisContextPaper, *, query: str) -> str:
        focus = self._select_grounded_sentence(paper, query=query)
        if focus:
            return f"[{paper.citation_index}] {focus}"
        year_text = f" ({paper.year})" if paper.year else ""
        return f"[{paper.citation_index}] {paper.title}{year_text} was retrieved as a top-ranked source."

    def _select_grounded_sentence(self, paper: SynthesisContextPaper, *, query: str) -> str | None:
        if not paper.abstract:
            return None

        sentences = [sentence.strip() for sentence in _SENTENCE_PATTERN.split(paper.abstract) if sentence.strip()]
        if not sentences:
            return None

        query_tokens = set(_WORD_PATTERN.findall(query.lower()))
        ranked_sentences = sorted(
            sentences[:8],
            key=lambda sentence: len(query_tokens & set(_WORD_PATTERN.findall(sentence.lower()))),
            reverse=True,
        )
        return self._truncate(ranked_sentences[0], 280)

    def _format_citations(self, papers: Sequence[SynthesisContextPaper]) -> str:
        return " ".join(f"[{paper.citation_index}]" for paper in papers)

    def _truncate(self, value: str | None, max_chars: int) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.split())
        if len(normalized) <= max_chars:
            return normalized
        return f"{normalized[: max_chars - 1].rstrip()}..."
