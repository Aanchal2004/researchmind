from __future__ import annotations

"""LLM-powered synthesis service using Google Gemini.

Fallback chain: Gemini → Ollama (if configured) → Extractive.

- If Gemini succeeds → return grounded LLM synthesis.
- If Gemini fails/times out → try `secondary_fallback` (Ollama) if provided.
- If Ollama also fails → fall back to deterministic extractive synthesis.
"""

import asyncio
import hashlib
import json
import logging
from collections.abc import Sequence
from time import monotonic
from typing import Protocol, runtime_checkable

from google import genai
from google.genai import types as genai_types

from app.schemas.search import SearchResultItem, SearchSynthesis
from app.services.synthesis import SynthesisService

logger = logging.getLogger("researchmind.services.llm_synthesis")


@runtime_checkable
class SynthesisProtocol(Protocol):
    async def synthesize(
        self, *, query: str, papers: Sequence[SearchResultItem]
    ) -> SearchSynthesis: ...


_SYSTEM_INSTRUCTION = """\
You are ResearchMind's grounded synthesis layer.
Your job is to synthesise findings from academic paper abstracts.
Rules:
1. Use ONLY the provided paper titles and abstracts — do not invent facts.
2. Cite every factual claim with [N] where N is the paper index.
3. Return ONLY valid JSON — no markdown, no prose outside the JSON.
4. If evidence is insufficient, say so plainly inside the JSON fields.
"""

_USER_PROMPT_TEMPLATE = """\
Research query: {query}

Retrieved papers:
{paper_blocks}

Return a JSON object with exactly these keys:
{{
  "summary": "<2-4 sentence synthesis with inline [N] citations>",
  "highlights": ["<grounded takeaway 1 with [N]>", "<takeaway 2>", "<takeaway 3>"],
  "key_claims": [
    {{"claim": "<claim text>", "citation": N, "paper_title": "<title>"}},
    ...
  ]
}}
"""


class LLMSynthesisService:
    """Gemini-backed synthesis with Ollama → Extractive fallback chain."""

    def __init__(
        self,
        *,
        gemini_api_key: str,
        model: str,
        temperature: float,
        max_output_tokens: int,
        request_timeout_seconds: float,
        cache_ttl_seconds: float,
        extractive_fallback: SynthesisService,
        secondary_fallback: SynthesisProtocol | None = None,
    ) -> None:
        self._client = genai.Client(api_key=gemini_api_key)
        self._model = model
        self._temperature = temperature
        self._max_output_tokens = max_output_tokens
        self._timeout = request_timeout_seconds
        self._cache_ttl = cache_ttl_seconds
        # extractive_fallback is always SynthesisService — used for build_context
        # and as the last-resort fallback.
        self._extractive = extractive_fallback
        # secondary_fallback is Ollama (or any SynthesisProtocol). Tried before
        # falling all the way back to extractive.
        self._secondary = secondary_fallback
        self._cache: dict[str, tuple[SearchSynthesis, float]] = {}
        self._cache_lock = asyncio.Lock()

    async def synthesize(
        self,
        *,
        query: str,
        papers: Sequence[SearchResultItem],
    ) -> SearchSynthesis:
        if not papers:
            return await self._extractive.synthesize(query=query, papers=papers)

        cache_key = self._build_cache_key(query, papers)
        cached = await self._get_cached(cache_key)
        if cached is not None:
            return cached

        result = await self._call_llm(query=query, papers=papers)
        await self._set_cached(cache_key, result)
        return result

    async def _call_llm(
        self,
        *,
        query: str,
        papers: Sequence[SearchResultItem],
    ) -> SearchSynthesis:
        context_papers = self._extractive.build_context(papers)
        paper_blocks = "\n\n".join(
            f"[{p.citation_index}] {p.title}\n"
            f"Year: {p.year or 'unknown'}\n"
            f"Authors: {', '.join(p.authors) or 'unknown'}\n"
            f"Abstract: {p.abstract or 'No abstract available.'}"
            for p in context_papers
        )
        prompt = _USER_PROMPT_TEMPLATE.format(
            query=query,
            paper_blocks=paper_blocks,
        )

        try:
            async with asyncio.timeout(self._timeout):
                response = await asyncio.to_thread(
                    self._client.models.generate_content,
                    model=self._model,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=_SYSTEM_INSTRUCTION,
                        temperature=self._temperature,
                        max_output_tokens=self._max_output_tokens,
                        response_mime_type="application/json",
                    ),
                )

            raw_text = response.text or ""
            result = self._parse_llm_response(raw_text, context_papers)
            logger.info("Gemini synthesis completed for query '%s' using %s", query, self._model)
            return result

        except TimeoutError:
            logger.warning("Gemini synthesis timed out for query '%s'", query)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini synthesis failed: %s", exc)

        # Try Ollama before falling all the way back to extractive.
        if self._secondary is not None:
            logger.info("Trying secondary fallback (Ollama) for query '%s'", query)
            return await self._secondary.synthesize(query=query, papers=papers)

        return await self._extractive.synthesize(query=query, papers=papers)

    def _parse_llm_response(self, raw: str, context_papers) -> SearchSynthesis:
        try:
            text = raw.strip()
            if text.startswith("```"):
                text = text.split("```", 2)[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.rsplit("```", 1)[0]

            data = json.loads(text.strip())
            summary = str(data.get("summary", "")).strip()
            highlights = [str(h) for h in data.get("highlights", []) if h]
            sources = [p.paper_id for p in context_papers]

            if not summary:
                raise ValueError("empty summary in LLM response")

            return SearchSynthesis(
                status="completed",
                summary=summary,
                highlights=highlights or ["No highlights were generated."],
                sources=sources,
                model=self._model,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini response parse failed: %s", exc)
            return SearchSynthesis(
                status="completed",
                summary=raw[:500] if raw else "LLM returned an unparseable response.",
                highlights=[],
                sources=[p.paper_id for p in context_papers],
                model=self._model,
            )

    def _build_cache_key(self, query: str, papers: Sequence[SearchResultItem]) -> str:
        paper_ids = "|".join(p.paper_id for p in papers[: self._extractive.max_papers])
        raw = f"{query.strip().lower()}::{paper_ids}"
        return hashlib.sha256(raw.encode()).hexdigest()

    async def _get_cached(self, key: str) -> SearchSynthesis | None:
        if self._cache_ttl <= 0:
            return None
        async with self._cache_lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            result, expires_at = entry
            if monotonic() > expires_at:
                del self._cache[key]
                return None
            return result

    async def _set_cached(self, key: str, result: SearchSynthesis) -> None:
        if self._cache_ttl <= 0:
            return
        async with self._cache_lock:
            self._cache[key] = (result, monotonic() + self._cache_ttl)
