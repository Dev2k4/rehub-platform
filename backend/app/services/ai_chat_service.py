from __future__ import annotations

import logging
import re
import hashlib
from dataclasses import dataclass
from typing import Literal, Dict, Any

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

# Simple in-memory cache for session consistency
# In production, use Redis or a similar persistent store
_SESSION_CACHE: Dict[str, Any] = {}
# Inventory paging state per session
_INVENTORY_STATE: Dict[str, Dict[str, Any]] = {}


def _get_cache_key(session_id: str | None, intent: str, message: str) -> str | None:
    if not session_id:
        return None
    # Normalize message for better matching
    norm = _normalize_text(message)
    # Use MD5 of normalized message to keep key size reasonable
    msg_hash = hashlib.md5(norm.encode("utf-8")).hexdigest()
    return f"{session_id}:{intent}:{msg_hash}"


def _is_next_page_request(message: str) -> bool:
    normalized = _normalize_text(message)
    return any(
        phrase in normalized
        for phrase in (
            "con nua",
            "con khong",
            "con san pham",
            "con hang",
            "them nua",
            "co nua",
            "co them",
        )
    )


def _format_inventory_page(listings: list[AiListingContext], is_next: bool) -> str:
    if not listings:
        return "Rất tiếc, hệ thống của chúng tôi đã hết loại sản phẩm này."

    header = (
        f"Dưới đây là {len(listings)} sản phẩm tiếp theo phù hợp:"
        if is_next
        else f"Dưới đây là {len(listings)} sản phẩm phù hợp:"
    )
    lines = [header, ""]
    for item in listings:
        parts = [f"• **{item.title}** — {item.price:,} VND"]
        parts.append(f"  Tình trạng: {item.condition_label}")
        if item.category_name:
            parts.append(f"  Danh mục: {item.category_name}")
        lines.append("\n".join(parts))
    return "\n".join(lines)


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

_INVENTORY_SHORT_BLOCKLIST = {
    "chao",
    "xin chao",
    "hi",
    "hello",
    "alo",
    "cam on",
    "cảm ơn",
    "thanks",
}

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
    if _looks_like_inventory_query(message):
        return "inventory"
    return "assistant"


def _looks_like_inventory_query(message: str) -> bool:
    normalized = _normalize_text(message)
    if any(keyword in normalized for keyword in _INVENTORY_KEYWORDS):
        return True

    if re.search(r"\b(co|có|con|còn)\b.*\b(khong|không|ko|kh)\b", message, flags=re.IGNORECASE):
        return True

    tokens = normalized.split()
    if len(tokens) <= 6:
        keywords = extract_product_keywords(message)
        normalized_keywords = [kw.strip().lower() for kw in keywords if kw.strip()]
        if normalized_keywords and all(kw not in _INVENTORY_SHORT_BLOCKLIST for kw in normalized_keywords):
            return True

    return False


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
        "Bạn là Rehub AI - trợ lý tìm kiếm giúp bạn tìm kiếm món hàng ưng ý, "
        "và đưa ra mức giá phù hợp để bạn đăng bán. "
        + _PLATFORM_CONTEXT
        + " Nhiệm vụ: hỗ trợ người dùng đăng tin, tìm sản phẩm, trả giá, đơn hàng, thanh toán, ký quỹ (escrow), "
        "và gợi ý giá bán. Trả lời bằng tiếng Việt có dấu, lịch sự, thân thiện và có emoji phù hợp. "
        "Câu trả lời nên đầy đủ thông tin, có hướng dẫn cụ thể theo từng bước khi cần. "
        "KHÔNG tự nhận mình là Antigravity/DeepMind hay công cụ lập trình. "
        "QUAN TRỌNG: KHÔNG hỏi lại người dùng. Trả lời trực tiếp và đầy đủ dựa trên dữ liệu có sẵn. "
        "CHỈ trả lời đúng nội dung yêu cầu, TUYỆT ĐỐI KHÔNG thêm các câu kết như 'Nếu còn thắc mắc...', "
        "'Bạn đang ở bước nào?', 'Bạn muốn mình gợi ý...?', 'Hy vọng thông tin này giúp ích cho bạn'. "
        "Trả lời xong là kết thúc hoàn toàn."
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
            + "\n\nNgười dùng đang tìm sản phẩm. Chỉ trả về danh sách 4-5 sản phẩm phù hợp từ dữ liệu trên (nếu có), kèm giá và tình trạng. "
            "KHÔNG thêm hướng dẫn mua bán, escrow, trả giá, hay mẹo đăng tin. KHÔNG viết đoạn giải thích dài."
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
            "Chào bạn, tôi là Rehub AI. Hiện tại trên hệ thống chưa có sản phẩm tương tự để tham khảo chính xác. "
            "Bạn có thể đăng tin với mức giá bạn mong muốn, hệ thống sẽ giúp bạn kết nối với người mua phù hợp."
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
        "Chào bạn, tôi là Rehub AI - trợ lý hỗ trợ giao dịch đồ cũ. "
        "Tôi có thể giúp bạn tìm kiếm món hàng ưng ý hoặc gợi ý mức giá phù hợp để bạn đăng bán món đồ của mình."
    )


async def _ask_provider(
    message: str,
    intent: AIIntent,
    context: dict[str, str],
    db_context: str | None = None,
) -> str:
    timeout = httpx.Timeout(settings.AI_CHAT_TIMEOUT_SECONDS, connect=10.0)
    # Tăng max_tokens lên 1000 và đảm bảo AI không bị ngắt quãng giữa chừng
    max_tokens = max(settings.AI_CHAT_MAX_TOKENS, 10000000)

    system_prompt = _build_system_prompt(intent, _current_path(context), db_context)

    def _build_payload(messages: list[dict[str, str]]) -> dict:
        return {
            "model": settings.AI_CHAT_MODEL,
            "stream": False,
            "messages": messages,
            "temperature": 0.1,
            # Some Gemini-compatible routers expect max_output_tokens
            "max_tokens": max_tokens,
            "max_output_tokens": max_tokens,
        }
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                _chat_endpoint(),
                json=_build_payload(
                    [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message},
                    ]
                ),
                headers=headers,
            )
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

        finish_reason = None
        if isinstance(first, dict):
            finish_reason = first.get("finish_reason") or first.get("finishReason")
            if not finish_reason:
                finish_reason = first.get("stop_reason") or first.get("stopReason")

        def _looks_truncated(text: str) -> bool:
            stripped = text.strip()
            if not stripped:
                return False
            if stripped.endswith(("*", "**", ":")):
                return True
            if (
                stripped[-1] not in ".!?…"
                and len(stripped.splitlines()) >= 2
                and len(stripped) > 60
            ):
                return True
            return False

        if str(finish_reason).lower() in {"length", "max_tokens", "max_output_tokens", "token_limit"} or _looks_truncated(content):
            continuation_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
                {"role": "assistant", "content": content.strip()},
                {
                    "role": "user",
                    "content": "Tiếp tục trả lời, viết nốt phần còn lại. Không lặp lại nội dung đã trả lời.",
                },
            ]
            try:
                cont_response = await client.post(
                    _chat_endpoint(),
                    json=_build_payload(continuation_messages),
                    headers=headers,
                )
                cont_data = cont_response.json()
                cont_choices = cont_data.get("choices")
                if isinstance(cont_choices, list) and cont_choices:
                    cont_first = cont_choices[0] if isinstance(cont_choices[0], dict) else {}
                    cont_msg = cont_first.get("message") if isinstance(cont_first, dict) else {}
                    cont_content = cont_msg.get("content") if isinstance(cont_msg, dict) else None
                    if isinstance(cont_content, str) and cont_content.strip():
                        return f"{content.strip()}\n\n{cont_content.strip()}"
            except Exception:
                logger.exception("Failed to continue truncated AI response")

        return content.strip()


def _clean_trailing_questions(text: str) -> str:
    """Remove trailing follow-up questions and fix persona myths."""
    # Fix identity issues directly in the string (case-insensitive)
    result = re.sub(r"antigravity|deepmind|google deepmind", "Rehub AI", text, flags=re.IGNORECASE)

    # Remove generic guidance blocks that are not requested
    _GUIDANCE_BLOCKS = [
        r"Để sở hữu[^\n]*(?:\n.+){1,12}",
        r"Cách tìm mua[^\n]*(?:\n.+){1,12}",
        r"Các bước để đăng tin[^\n]*(?:\n.+){1,12}",
        r"Lưu ý khi đăng tin[^\n]*(?:\n.+){1,12}",
        r"Lời khuyên khi đăng tin[^\n]*(?:\n.+){1,12}",
        r"📝[^\n]*(?:\n.+){1,12}",
    ]
    for pattern in _GUIDANCE_BLOCKS:
        result = re.sub(pattern, "", result, flags=re.IGNORECASE).strip()

    # Patterns to strip from the end of the response
    # We use "$" and ensure we only match if it's actually at the very end
    _TRAILING_PATTERNS = [
        r"Nếu còn thắc mắc[^.!?]*[.!?]?\s*$",
        r"Bạn đang ở bước nào[^.!?]*[.!?]?\s*$",
        r"Bạn muốn mình[^.!?]*[.!?]?\s*$",
        r"Bạn có muốn[^.!?]*[.!?]?\s*$",
        r"Hãy cho mình biết[^.!?]*[.!?]?\s*$",
        r"Bạn cần hướng dẫn[^.!?]*[.!?]?\s*$",
        r"Chúc bạn[^.!?]*[.!?]?\s*$",
        r"Hy vọng[^.!?]*[.!?]?\s*$",
    ]
    for pattern in _TRAILING_PATTERNS:
        result = re.sub(pattern, "", result, flags=re.IGNORECASE).strip()
    return result


def _is_identity_question(message: str) -> bool:
    normalized = _normalize_text(message)
    return any(
        phrase in normalized
        for phrase in (
            "ban la ai",
            "ban ten gi",
            "ban la gi",
            "ban co phai",
            "ban la tro ly",
        )
    )


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
    session_id: str | None = None,
) -> AiAnswer:
    context = context or {}
    intent = detect_intent(message, mode=mode)
    if _is_next_page_request(message):
        intent = "inventory"

    if _is_identity_question(message):
        res_obj = AiAnswer(
            answer=(
                "Chào bạn, tôi là Rehub AI - trợ lý tìm kiếm giúp bạn tìm kiếm món hàng ưng ý "
                "và gợi ý mức giá phù hợp để bạn đăng bán."
            ),
            provider=settings.AI_PROVIDER_NAME or "openai-compatible",
            model=settings.AI_CHAT_MODEL,
            intent="assistant",
            fallback_used=False,
            products=None,
        )
        cache_key = _get_cache_key(session_id, "assistant", message)
        if cache_key:
            _SESSION_CACHE[cache_key] = res_obj
        return res_obj

    is_next_page = intent == "inventory" and _is_next_page_request(message)

    # Check cache for session consistency
    cache_key = None if is_next_page else _get_cache_key(session_id, str(intent), message)
    if cache_key and cache_key in _SESSION_CACHE:
        logger.info(f"Session cache hit for {intent}: {cache_key}")
        return _SESSION_CACHE[cache_key]

    # --- Enrich with DB data for inventory/pricing intents ---
    db_listings: list[AiListingContext] = []
    db_context_text: str | None = None
    needs_db = intent in ("inventory", "pricing", "assistant")

    if needs_db and db is not None:
        try:
            keywords = extract_product_keywords(message)
            if intent == "inventory":
                if not session_id:
                    session_key = None
                else:
                    session_key = session_id

                if is_next_page and session_key and session_key in _INVENTORY_STATE:
                    state = _INVENTORY_STATE[session_key]
                    keywords = state.get("keywords") or keywords
                    offset = int(state.get("offset") or 0) + 5
                else:
                    offset = 0

                if keywords and any(len(kw) >= 2 for kw in keywords):
                    db_listings = await search_listings_for_ai(db, keywords, limit=5, offset=offset)
                    if session_key and keywords:
                        _INVENTORY_STATE[session_key] = {"keywords": keywords, "offset": offset}
            else:
                if keywords and any(len(kw) >= 2 for kw in keywords):
                    db_listings = await search_listings_for_ai(db, keywords, limit=5)
                    if db_listings:
                        db_context_text = format_listings_for_prompt(db_listings)
        except Exception:
            logger.exception("Failed to enrich AI context from DB")

    products = _serialize_products(db_listings) if db_listings else None

    if intent == "inventory":
        answer = _format_inventory_page(db_listings, is_next_page)
        res_obj = AiAnswer(
            answer=answer,
            provider="db-search",
            model="sql-search-v1",
            intent=intent,
            fallback_used=False,
            products=products,
        )
        if cache_key:
            _SESSION_CACHE[cache_key] = res_obj
        return res_obj

    # --- Try LLM provider ---
    if _provider_is_configured():
        try:
            raw_answer = await _ask_provider(message, intent, context, db_context=db_context_text)
            answer = _clean_trailing_questions(raw_answer)
            res_obj = AiAnswer(
                answer=answer,
                provider=settings.AI_PROVIDER_NAME or "openai-compatible",
                model=settings.AI_CHAT_MODEL,
                intent=intent,
                fallback_used=False,
                products=products,
            )
            # Store in cache
            if cache_key:
                _SESSION_CACHE[cache_key] = res_obj
            return res_obj
        except HTTPException as exc:
            logger.warning("AI provider failed, falling back to local answer: %s", exc.detail)
            if not settings.AI_CHAT_FALLBACK_ENABLED:
                raise
        except Exception:
            logger.exception("Unexpected AI provider failure, falling back to local answer")
            if not settings.AI_CHAT_FALLBACK_ENABLED:
                raise HTTPException(status_code=502, detail="AI provider không phản hồi")

    # --- Fallback ---
    res_obj = AiAnswer(
        answer=_fallback_answer(intent, message, context, db_listings=db_listings or None),
        provider="local-fallback",
        model="heuristic-v1",
        intent=intent,
        fallback_used=True,
        products=products,
    )
    # Store in cache
    if cache_key:
        _SESSION_CACHE[cache_key] = res_obj
    return res_obj