import httpx
from fastapi import HTTPException

from app.core.config import settings


def _chat_endpoint() -> str:
    base = settings.AI_PROVIDER_BASE_URL.rstrip("/")
    return f"{base}/chat/completions"


def _require_ai_config() -> None:
    if not settings.AI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI chưa được cấu hình trên máy chủ (thiếu AI_API_KEY)",
        )


async def generate_ai_answer(
    user_message: str,
    context: dict[str, str] | None = None,
) -> str:
    _require_ai_config()

    context = context or {}
    system_prompt = (
        "Bạn là Trợ lý AI của ReHub Marketplace. "
        "Trả lời bằng tiếng Việt có dấu, ngắn gọn, rõ ràng, ưu tiên hướng dẫn thao tác trong hệ thống mua bán. "
        "Không bịa dữ liệu. Nếu thiếu thông tin thì nói rõ và hỏi lại 1 câu ngắn."
    )

    payload = {
        "model": settings.AI_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "system",
                "content": f"Ngữ cảnh trang: {context.get('pathname', '/')}",
            },
            {"role": "user", "content": user_message},
        ],
        "temperature": settings.AI_CHAT_TEMPERATURE,
        "max_tokens": settings.AI_CHAT_MAX_TOKENS,
    }

    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }

    timeout = httpx.Timeout(25.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(_chat_endpoint(), json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Không thể kết nối AI provider: {exc}")

    if response.status_code >= 400:
        detail = "AI provider trả lỗi"
        try:
            payload = response.json()
            detail = (
                payload.get("error", {}).get("message")
                or payload.get("message")
                or detail
            )
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=detail)

    data = response.json()
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise HTTPException(status_code=502, detail="AI provider trả dữ liệu không hợp lệ")

    first = choices[0] if isinstance(choices[0], dict) else {}
    message = first.get("message") if isinstance(first, dict) else {}
    content = message.get("content") if isinstance(message, dict) else None

    if not isinstance(content, str) or not content.strip():
        raise HTTPException(status_code=502, detail="AI provider không trả về nội dung trả lời")

    return content.strip()
