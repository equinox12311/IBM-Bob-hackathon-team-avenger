"""HTTP client for cortex-api. Mirrors ``cortex-web/src/api/client.ts``."""

from __future__ import annotations

import httpx

from cortex_bot.config import settings


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.diary_token}",
        "Content-Type": "application/json",
    }


async def save_entry(text: str, source: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{settings.api_base_url}/api/v1/entries",
            headers=_headers(),
            json={"text": text, "source": source},
        )
        r.raise_for_status()
        return r.json()


async def search(query: str, k: int = 5) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{settings.api_base_url}/api/v1/search",
            headers=_headers(),
            params={"q": query, "k": k},
        )
        r.raise_for_status()
        return r.json()


async def timeline(limit: int = 10) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{settings.api_base_url}/api/v1/entries",
            headers=_headers(),
            params={"limit": limit},
        )
        r.raise_for_status()
        return r.json()
