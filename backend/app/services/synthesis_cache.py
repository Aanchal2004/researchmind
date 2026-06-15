from __future__ import annotations

"""In-process synthesis cache keyed by query_id.

Stores synthesis results so the poll endpoint can serve them after the
background task completes. TTL defaults to 10 minutes — enough for any
reasonable session. Redis will replace this in Phase 8.
"""

import asyncio
import logging
from time import monotonic

from app.schemas.search import SearchSynthesis

logger = logging.getLogger("researchmind.services.synthesis_cache")

_DEFAULT_TTL = 600.0  # 10 minutes


class SynthesisCache:
    """Thread-safe in-process cache for synthesis results."""

    def __init__(self, ttl_seconds: float = _DEFAULT_TTL) -> None:
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[SearchSynthesis, float]] = {}
        self._lock = asyncio.Lock()

    async def set(self, query_id: str, result: SearchSynthesis) -> None:
        async with self._lock:
            self._store[query_id] = (result, monotonic() + self._ttl)
            logger.debug("Synthesis cached for query_id=%s model=%s", query_id, result.model)

    async def get(self, query_id: str) -> SearchSynthesis | None:
        async with self._lock:
            entry = self._store.get(query_id)
            if entry is None:
                return None
            result, expires_at = entry
            if monotonic() > expires_at:
                del self._store[query_id]
                return None
            return result

    async def evict_expired(self) -> None:
        now = monotonic()
        async with self._lock:
            expired = [k for k, (_, exp) in self._store.items() if now > exp]
            for k in expired:
                del self._store[k]


# Module-level singleton — imported by routes and container.
synthesis_cache = SynthesisCache()
