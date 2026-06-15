from __future__ import annotations

"""Unpaywall enricher — resolves open-access PDF URLs by DOI.

This is not a standalone search provider but an enrichment pass.
It is called after the main search merge to attach PDF URLs to
results that have a DOI but no PDF URL yet.
"""

import asyncio
import logging
from time import monotonic

import httpx

from app.schemas.search import SearchResultItem

UNPAYWALL_BASE = "https://api.unpaywall.org/v2"


class UnpaywallEnricher:
    """Attach open-access PDF URLs to SearchResultItems that have a DOI."""

    def __init__(
        self,
        http_client: httpx.AsyncClient,
        email: str,
        request_timeout_seconds: float = 5.0,
        min_interval_seconds: float = 0.2,
        max_concurrent: int = 4,
    ) -> None:
        self.http_client = http_client
        self.email = email
        self.request_timeout_seconds = request_timeout_seconds
        self.min_interval_seconds = min_interval_seconds
        self.logger = logging.getLogger("researchmind.providers.unpaywall")
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._rate_limit_lock = asyncio.Lock()
        self._last_request_at = 0.0

    async def enrich(self, items: list[SearchResultItem]) -> list[SearchResultItem]:
        """Return a new list with open-access PDF URLs attached where available."""
        candidates = [item for item in items if item.doi and not item.pdf_url]
        if not candidates:
            return items

        results = await asyncio.gather(
            *[self._resolve_one(item) for item in candidates],
            return_exceptions=True,
        )

        resolved: dict[str, str] = {}
        for item, result in zip(candidates, results):
            if isinstance(result, str):
                resolved[item.paper_id] = result

        return [
            item.model_copy(update={"pdf_url": resolved[item.paper_id], "open_access": True})
            if item.paper_id in resolved
            else item
            for item in items
        ]

    async def _resolve_one(self, item: SearchResultItem) -> str | None:
        if not item.doi:
            return None

        async with self._semaphore:
            await self._respect_interval()
            url = f"{UNPAYWALL_BASE}/{item.doi}"
            try:
                resp = await self.http_client.get(
                    url,
                    params={"email": self.email},
                    timeout=self.request_timeout_seconds,
                )
                if resp.status_code == 404:
                    return None
                resp.raise_for_status()
                data = resp.json()

                oa_location = data.get("best_oa_location")
                if not oa_location:
                    return None

                pdf_url = oa_location.get("url_for_pdf") or oa_location.get("url")
                return pdf_url or None
            except Exception as exc:  # noqa: BLE001
                self.logger.debug("Unpaywall resolve failed for DOI %s: %s", item.doi, exc)
                return None

    async def _respect_interval(self) -> None:
        async with self._rate_limit_lock:
            elapsed = monotonic() - self._last_request_at
            if self._last_request_at and elapsed < self.min_interval_seconds:
                await asyncio.sleep(self.min_interval_seconds - elapsed)
            self._last_request_at = monotonic()
