from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Literal

import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.ai_db_context import (
    AiListingContext,
    extract_product_keywords,
    format_listings_as_reply,
    format_listings_for_prompt,
    search_listings_for_ai,
)

logger = logging.getLogger(__name__)

AIIntent = Literal["assistant", "howto", "inventory", "pricing"]

_HOWTO_KEYWORDS = (
    "dang tin",
    "đăng tin",
    "tao tin",
    "tạo tin",
    "sua tin",
    "sửa tin",
    "xoa tin",
    "xóa tin",
    "cap nhat tin",
    "cập nhật tin",
    "sua san pham",
    "sửa sản phẩm",
    "huong dan",
    "hướng dẫn",
    "cach dung",
    "cách dùng",
    "escrow",
    "don hang",
    "đơn hàng",
    "thanh toan",
    "thanh toán",
    "ky quy",
    "ký quỹ",
    "nap ky quy",
    "nạp ký quỹ",
    "nap tien",
    "nạp tiền",
    "bao mat giao dich",
    "bảo mật giao dịch",
    "mua ngay",
    "tra gia",
    "trả giá",
)

_INVENTORY_KEYWORDS = (
    "co khong",
    "có không",
    "con hang",
    "còn hàng",
    "tim",
    "tìm",
    "san pham nay",
    "sản phẩm này",
    "hang nay",
    "hàng này",
    "mua",
)

_PRICING_KEYWORDS = (
    "gia bao nhieu",
    "giá bao nhiêu",
    "nen ban",
    "nên bán",
    "gia hop ly",
    "giá hợp lý",
    "uoc gia",
    "ước giá",
    "goi y gia",
    "gợi ý giá",
    "dinh gia",
    "định giá",
    "ban gia nao",
    "bán giá nào",
    "bao nhieu tien",
    "bao nhiêu tiền",
    "muon ban",
    "muốn bán",
)


@dataclass(slots=True)
class AiAnswer:
    answer: str
    provider: str
    model: str
    intent: AIIntent
    fallback_used: bool
    products: list[dict] | None = None


def _normalize_text(value: str) -> str:
    text = value.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def detect_intent(message: str, mode: str = "auto") -> AIIntent:
    if mode == "price":
        return "pricing"
    if mode == "chat":
        return "assistant"

    normalized = _normalize_text(message)
    if any(keyword in normalized for keyword in _PRICING_KEYWORDS):
        return "pricing"
    if any(keyword in normalized for keyword in _HOWTO_KEYWORDS):
        return "howto"
    if any(keyword in normalized for keyword in _INVENTORY_KEYWORDS):
        return "inventory"
    return "assistant"


def _current_path(context: dict[str, str]) -> str:
    pathname = context.get("pathname") or context.get("path") or "/"
    return pathname.strip() or "/"


def _provider_is_configured() -> bool:
    return bool(settings.AI_API_KEY.strip()) and bool(settings.AI_PROVIDER_BASE_URL.strip()) and bool(settings.AI_CHAT_MODEL.strip())


def _chat_endpoint() -> str:
    base = settings.AI_PROVIDER_BASE_URL.rstrip("/")
    return f"{base}/chat/completions"


_PLATFORM_CONTEXT = (
    "ReHub là sàn giao dịch đồ cũ (secondhand marketplace) tại Việt Nam. "
    "Chức năng chính: Đăng tin bán đồ cũ (listings) với ảnh, giá, tình trạng; "
    "Trả giá / thương lượng (offers); Thanh toán an toàn qua ký quỹ (escrow); "
    "Theo dõi đơn hàng và giao hàng (fulfillment); Chat trực tiếp giữa người mua và người bán; "
    "Đánh giá sau giao dịch (reviews). "
    "Các tình trạng sản phẩm: Mới 100% (Brand New), Như mới (Like New), Tốt (Good), Trung bình (Fair), Cũ (Poor)."
)


def _build_system_prompt(
    intent: AIIntent,
    pathname: str,
    db_context: str | None = None,
) -> str:
    base_prompt = (
        "Bạn là Trợ lý AI của ReHub Marketplace. "
        + _PLATFORM_CONTEXT
        + " Nhiệm vụ: hỗ trợ người dùng đăng tin, tìm sản phẩm, trả giá, đơn hàng, thanh toán, ký quỹ (escrow), "
        "và gợi ý giá bán. Trả lời bằng tiếng Việt có dấu, lịch sự, thân thiện và có emoji phù hợp. "
        "Câu trả lời nên đầy đủ thông tin, có hướng dẫn cụ thể theo từng bước khi cần. "
        "KHÔNG tự nhận mình là Antigravity/DeepMind hay công cụ lập trình. "
        "QUAN TRỌNG: KHÔNG hỏi lại người dùng. Trả lời trực tiếp và đầy đủ dựa trên dữ liệu có sẵn. "
        "KHÔNG thêm câu kiểu 'Bạn đang ở bước nào?', 'Bạn muốn mình gợi ý...?', 'Nếu còn thắc mắc...'. "
        "Trả lời xong là kết thúc, không cần lời mời hỏi thêm."
    )

    if db_context:
        base_prompt += f"\n\n{db_context}"

    if intent == "pricing":
        return (
            base_prompt
            + "\n\nNgười dùng đang hỏi gợi ý giá bán. Hãy tập trung vào việc ước giá hợp lý dựa trên dữ liệu sản phẩm tương tự, nêu khoảng giá cụ thể."
        )
    if intent == "howto":
        return (
            base_prompt
            + f"\n\nNgười dùng đang ở ngữ cảnh trang {pathname}. Hãy hướng dẫn từng bước thao tác phù hợp."
        )
    if intent == "inventory":
        return (
            base_prompt
            + "\n\nNgười dùng đang tìm sản phẩm. Hãy liệt kê các sản phẩm phù hợp từ dữ liệu trên nếu có, kèm giá và tình trạng."
        )
    return base_prompt


def _fallback_answer(
    intent: AIIntent,
    message: str,
    context: dict[str, str],
    db_listings: list[AiListingContext] | None = None,
) -> str:
    """Generate a local fallback answer when LLM is unavailable."""
    # If we have DB data, format it directly
    if db_listings:
        return format_listings_as_reply(db_listings, intent)

    pathname = _current_path(context)
    normalized_message = _normalize_text(message)

    if intent == "pricing":
        return (
            "Hiện tại trên ReHub chưa có sản phẩm tương tự để tham khảo giá. "
            "Bạn có thể đăng tin và đặt giá bạn mong muốn, người mua sẽ trả giá nếu quan tâm."
        )

    if intent == "howto":
        if pathname.startswith("/orders") or any(
            keyword in normalized_message
            for keyword in ("don hang", "ky quy", "nap ky quy", "escrow", "thanh toan")
        ):
            return (
                "Với đơn hàng và ký quỹ (escrow), bạn làm theo các bước sau ✅:\n"
                "1) Vào trang Chi tiết đơn hàng để xem trạng thái hiện tại.\n"
                "2) Bấm nút Nạp/Ký quỹ và làm theo hướng dẫn thanh toán.\n"
                "3) Chờ người bán xác nhận, hệ thống sẽ giữ tiền an toàn.\n"
                "4) Khi nhận hàng ok, bạn xác nhận hoàn tất để giải ngân cho người bán."
            )
        if pathname.startswith("/listings"):
            return (
                "Để đăng tin nhanh và hiệu quả ✍️:\n"
                "1) Nhập tiêu đề rõ ràng (tên sản phẩm + tình trạng).\n"
                "2) Viết mô tả chi tiết (mẫu mã, phụ kiện, bảo hành nếu có).\n"
                "3) Chọn danh mục và tình trạng phù hợp.\n"
                "4) Nhập giá bán mong muốn (có thể bật thương lượng).\n"
                "5) Thêm ảnh rõ, đủ góc, tránh mờ/thiếu sáng.\n"
                "6) Kiểm tra lại rồi bấm Đăng tin."
            )
        if pathname.startswith("/offers"):
            return (
                "Luồng trả giá trên ReHub 💬:\n"
                "1) Vào chi tiết tin đăng và xem mức giá đề xuất.\n"
                "2) Gửi offer ở mức phù hợp với tình trạng thực tế.\n"
                "3) Theo dõi phản hồi từ người bán trong mục Đơn hàng/Trả giá.\n"
                "4) Nếu đạt thỏa thuận, tiến hành thanh toán/ký quỹ."
            )
        return (
            "ReHub hỗ trợ đăng tin, trả giá, thanh toán, ký quỹ, và theo dõi đơn hàng. "
            "Bạn có thể hỏi cụ thể về bất kỳ thao tác nào trên hệ thống."
        )

    if intent == "inventory":
        return (
            "Hiện tại trên ReHub chưa tìm thấy sản phẩm phù hợp với từ khóa của bạn. "
            "Bạn có thể thử tìm với từ khóa khác hoặc duyệt theo danh mục."
        )

    return (
        "ReHub là sàn giao dịch đồ cũ. "
        "Bạn có thể hỏi về cách đăng tin, tìm sản phẩm, hoặc nhờ gợi ý giá bán cho món đồ bạn đang có."
    )


async def _ask_provider(
    message: str,
    intent: AIIntent,
    context: dict[str, str],
    db_context: str | None = None,
) -> str:
    timeout = httpx.Timeout(settings.AI_CHAT_TIMEOUT_SECONDS, connect=10.0)
    payload = {
        "model": settings.AI_CHAT_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": _build_system_prompt(intent, _current_path(context), db_context)},
            {"role": "system", "content": f"Ngữ cảnh trang: {_current_path(context)}"},
            {"role": "user", "content": message},
        ],
        "temperature": settings.AI_CHAT_TEMPERATURE,
        "max_tokens": settings.AI_CHAT_MAX_TOKENS,
    }
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(_chat_endpoint(), json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Không thể kết nối AI provider: {exc}") from exc

    if response.status_code >= 400:
        detail = "AI provider trả lỗi"
        try:
            payload_json = response.json()
            detail = payload_json.get("error", {}).get("message") or payload_json.get("message") or detail
        except Exception:
            pass
        raise HTTPException(status_code=response.status_code if response.status_code < 500 else 502, detail=detail)

    data = response.json()
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise HTTPException(status_code=502, detail="AI provider trả dữ liệu không hợp lệ")

    first = choices[0] if isinstance(choices[0], dict) else {}
    message_data = first.get("message") if isinstance(first, dict) else {}
    content = message_data.get("content") if isinstance(message_data, dict) else None
    if not isinstance(content, str) or not content.strip():
        raise HTTPException(status_code=502, detail="AI provider không trả về nội dung trả lời")
    return content.strip()


def _clean_trailing_questions(text: str) -> str:
    """Remove trailing follow-up questions that the LLM might still generate."""
    # Patterns to strip from the end of the response
    _TRAILING_PATTERNS = [
        r"Nếu còn thắc mắc[^.!]*[.!?]*\s*$",
        r"Bạn đang ở bước nào[^.!]*[.!?]*\s*$",
        r"Bạn muốn mình[^.!]*[.!?]*\s*$",
        r"Bạn có muốn[^.!]*[.!?]*\s*$",
        r"Hãy cho mình biết[^.!]*[.!?]*\s*$",
        r"Bạn cần hướng dẫn[^.!]*[.!?]*\s*$",
    ]
    result = text
    for pattern in _TRAILING_PATTERNS:
        result = re.sub(pattern, "", result, flags=re.IGNORECASE).strip()
    return result


def _serialize_products(listings: list[AiListingContext]) -> list[dict]:
    """Convert listing context objects to JSON-serializable dicts for the API response."""
    return [
        {
            "listing_id": item.listing_id,
            "title": item.title,
            "price": item.price,
            "condition": item.condition,
            "condition_label": item.condition_label,
            "category_name": item.category_name,
            "image_url": item.image_url,
        }
        for item in listings
    ]


async def generate_ai_answer(
    message: str,
    context: dict[str, str] | None = None,
    mode: str = "auto",
    db: AsyncSession | None = None,
) -> AiAnswer:
    context = context or {}
    intent = detect_intent(message, mode=mode)

    # --- Enrich with DB data for inventory/pricing intents ---
    db_listings: list[AiListingContext] = []
    db_context_text: str | None = None
    needs_db = intent in ("inventory", "pricing", "assistant")

    if needs_db and db is not None:
        try:
            keywords = extract_product_keywords(message)
            if keywords and any(len(kw) >= 2 for kw in keywords):
                db_listings = await search_listings_for_ai(db, keywords, limit=5)
                if db_listings:
                    db_context_text = format_listings_for_prompt(db_listings)
        except Exception:
            logger.exception("Failed to enrich AI context from DB")

    products = _serialize_products(db_listings) if db_listings else None

    # --- Try LLM provider ---
    if _provider_is_configured():
        try:
            raw_answer = await _ask_provider(message, intent, context, db_context=db_context_text)
            answer = _clean_trailing_questions(raw_answer)
            return AiAnswer(
                answer=answer,
                provider=settings.AI_PROVIDER_NAME or "openai-compatible",
                model=settings.AI_CHAT_MODEL,
                intent=intent,
                fallback_used=False,
                products=products,
            )
        except HTTPException as exc:
            logger.warning("AI provider failed, falling back to local answer: %s", exc.detail)
            if not settings.AI_CHAT_FALLBACK_ENABLED:
                raise
        except Exception:
            logger.exception("Unexpected AI provider failure, falling back to local answer")
            if not settings.AI_CHAT_FALLBACK_ENABLED:
                raise HTTPException(status_code=502, detail="AI provider không phản hồi")

    # --- Fallback ---
    return AiAnswer(
        answer=_fallback_answer(intent, message, context, db_listings=db_listings or None),
        provider="local-fallback",
        model="heuristic-v1",
        intent=intent,
        fallback_used=True,
        products=products,
    )