import time
from dataclasses import dataclass

from app.core.cache import cache


@dataclass(slots=True)
class RateLimitError(Exception):
    message: str


_memory_counters: dict[str, tuple[int, float]] = {}


async def enforce_rate_limit(scope: str, subject: str, limit: int, window_seconds: int) -> None:
    """Enforce a simple fixed-window rate limit for a scope/subject pair."""
    key = f"rate_limit:{scope}:{subject}"

    if cache.is_connected:
        count = await cache.incr(key)
        if count == 1:
            await cache.expire(key, window_seconds)
        if count > limit:
            ttl = await cache.ttl(key)
            retry_after = ttl if ttl > 0 else window_seconds
            raise RateLimitError(
                f"Rate limit exceeded for {scope}. Try again in {retry_after} seconds."
            )
        return

    now = time.monotonic()
    current_count, reset_at = _memory_counters.get(key, (0, now + window_seconds))
    if now >= reset_at:
        current_count = 0
        reset_at = now + window_seconds

    current_count += 1
    _memory_counters[key] = (current_count, reset_at)

    if current_count > limit:
        retry_after = max(1, int(reset_at - now))
        raise RateLimitError(
            f"Rate limit exceeded for {scope}. Try again in {retry_after} seconds."
        )
