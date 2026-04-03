import json
import logging
from typing import Any

from app.core.config import settings

try:
    import redis.asyncio as redis_asyncio
except ImportError:  # pragma: no cover - optional dependency fallback
    redis_asyncio = None

logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(self) -> None:
        self._client: Any = None

    @property
    def is_available(self) -> bool:
        return redis_asyncio is not None and bool(settings.REDIS_URL)

    @property
    def is_connected(self) -> bool:
        return self._client is not None

    async def connect(self) -> None:
        if not self.is_available:
            logger.info("Redis cache is disabled")
            return

        try:
            self._client = redis_asyncio.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=10,
            )
            await self._client.ping()
            logger.info("Redis cache connected")
        except Exception:
            logger.exception("Redis cache connection failed; falling back to no cache")
            self._client = None

    async def disconnect(self) -> None:
        client = self._client
        self._client = None
        if client is None:
            return

        try:
            await client.aclose()
        except Exception:
            logger.exception("Failed to disconnect Redis cache cleanly")

    async def get(self, key: str) -> str | None:
        if self._client is None:
            return None
        return await self._client.get(key)

    async def get_json(self, key: str) -> Any:
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Failed to decode Redis cache payload for key %s", key)
            return None

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        if self._client is None:
            return

        payload = value if isinstance(value, str) else json.dumps(value, default=str)
        await self._client.set(key, payload, ex=ttl or settings.REDIS_CACHE_TTL_SECONDS)

    async def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        await self.set(key, value, ttl)

    async def delete(self, key: str) -> None:
        if self._client is None:
            return
        await self._client.delete(key)

    async def incr(self, key: str) -> int:
        if self._client is None:
            return 0
        return int(await self._client.incr(key))

    async def expire(self, key: str, ttl: int) -> None:
        if self._client is None:
            return
        await self._client.expire(key, ttl)

    async def ttl(self, key: str) -> int:
        if self._client is None:
            return -2
        return int(await self._client.ttl(key))

    async def delete_pattern(self, pattern: str) -> None:
        if self._client is None:
            return

        keys: list[str] = []
        async for key in self._client.scan_iter(match=pattern):
            keys.append(key)

        if keys:
            await self._client.delete(*keys)


cache = RedisCache()
