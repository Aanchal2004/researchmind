from __future__ import annotations

"""Ollama-backed synthesis service using the local REST API.

Calls the Ollama OpenAI-compatible endpoint at http://localhost:11434.
Falls back to the extractive SynthesisService on any failure.
"""

import asyncio
import hashlib
import json
import logging
from collections.abc import Sequence
from time import monotonic

import httpx

from app.schemas.search import SearchResultItem, SearchSynthesis
from app.services.synthesis import SynthesisService

logger = logging.getLogger("researchmind.services.ollama_synthesis")

_SYSTEM = (
    "You are ResearchMind's grounded synthesis layer. "
    "Synthesise findings from the provided academic paper abstracts. "
    "Use ONLY the information given — do not invent facts. "
    "Cite every claim with [N] where N is the paper index. "
    "Return ONLY valid JSON — no markdown fences, no prose outside JSON."
)

_PROMPT_TEMPLATE = """\
Research query: {query}

Retrieved papers:
{paper_blocks}

Return a JSON object with exactly these keys:
{{
  "summary": "<2-4 sentence synthesis with inline [N] citations>",
  "highlights": ["<grounded takeaway 1 with [N]>", "<takeaway 2>", "<takeaway 3>"]
}}"""


class OllamaSynthesisService:
    """Local Ollama LLM synthesis with extractive fallback."""

    def __init__(
        self,
        *,
        base_url: str,
        model: str,
        request_timeout_seconds: float,
        cache_ttl_seconds: float,
        extractive_fallback: SynthesisService,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = request_timeout_seconds
        self._cache_ttl = cache_ttl_seconds
        self._fallback = extractive_fallback
        self._cache: dict[str, tuple[SearchSynthesis, float]] = {}
        self._cache_lock = asyncio.Lock()

    async def synthesize(
        self,
        *,
        query: str,
        papers: Sequence[SearchResultItem],
    ) -> SearchSynthesis:
        if not papers:
            return await self._fallback.synthesize(query=query, papers=papers)

        cache_key = self._build_cache_key(query, papers)
        cached = await self._get_cached(cache_key)
        if cached is not None:
            return cached

        result = await self._call_ollama(query=query, papers=papers)
        await self._set_cached(cache_key, result)
        return result

    async def _call_ollama(
        self,
        *,
        query: str,
        papers: Sequence[SearchResultItem],
    ) -> SearchSynthesis:
        context_papers = self._fallback.build_context(papers)
        paper_blocks = "\n\n".join(
            f"[{p.citation_index}] {p.title}\n"
            f"Year: {p.year or 'unknown'}\n"
            f"Authors: {', '.join(p.authors) or 'unknown'}\n"
            f"Abstract: {p.abstract or 'No abstract available.'}"
            for p in context_papers
        )
        prompt = _PROMPT_TEMPLATE.format(query=query, paper_blocks=paper_blocks)

        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.2},
        }

        try:
            async with asyncio.timeout(self._timeout):
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self._base_url}/api/chat",
                        json=payload,
                        timeout=self._timeout,
                    )
                    response.raise_for_status()
                    data = response.json()

            raw_text = data.get("message", {}).get("content", "")
            result = self._parse_response(raw_text, context_papers)
            logger.info("Ollama synthesis completed for query '%s'", query)
            return result

        except TimeoutError:
            logger.warning("Ollama synthesis timed out for query '%s', using extractive fallback", query)
        except httpx.ConnectError:
            logger.warning("Ollama not reachable at %s, using extractive fallback", self._base_url)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Ollama synthesis failed: %s — using extractive fallback", exc)

        return await self._fallback.synthesize(query=query, papers=papers)

    def _parse_response(self, raw: str, context_papers) -> SearchSynthesis:
        try:
            text = raw.strip()
            # Strip accidental markdown fences
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
                raise ValueError("empty summary")

            return SearchSynthesis(
                status="completed",
                summary=summary,
                highlights=highlights or ["No highlights were generated."],
                sources=sources,
                model=self._model,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Ollama response parse failed: %s", exc)
            return SearchSynthesis(
                status="completed",
                summary=raw[:500] if raw else "Could not parse Ollama response.",
                highlights=[],
                sources=[p.paper_id for p in context_papers],
            )

    def _build_cache_key(self, query: str, papers: Sequence[SearchResultItem]) -> str:
        paper_ids = "|".join(p.paper_id for p in papers[: self._fallback.max_papers])
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
