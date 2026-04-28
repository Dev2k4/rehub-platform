from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Literal

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.services.ai_price_service import (
    PriceDatasetUnavailableError,
    compose_price_suggestion_reply,
    get_price_suggestion_engine,
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
)


@dataclass(slots=True)
class AiAnswer:
    answer: str
    provider: str
    model: str
    intent: AIIntent
    fallback_used: bool


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


def _fallback_answer(intent: AIIntent, message: str, context: dict[str, str]) -> str:
    pathname = _current_path(context)
    normalized_message = _normalize_text(message)
    if intent == "pricing":
        engine = get_price_suggestion_engine()
        try:
            suggestion = engine.suggest(message, context=context)
            return compose_price_suggestion_reply(suggestion)
        except PriceDatasetUnavailableError:
            return (
                "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ. "
                "Hiện mình chưa có dữ liệu giá để ước lượng. "
                "Bạn hãy cấu hình `AI_PRICE_DATASET_PATH` trỏ tới file CSV sản phẩm, rồi gửi lại tên sản phẩm và tình trạng nhé. "
                "Bạn có hài lòng với câu trả lời này không? "
                "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"
            )
        except Exception as exc:  # pragma: no cover - defensive fallback
            logger.exception("Price fallback generation failed")
            return f"Mình chưa ước giá được lúc này: {exc}"

    if intent == "howto":
        if pathname.startswith("/orders") or any(
            keyword in normalized_message
            for keyword in ("don hang", "ky quy", "nap ky quy", "escrow", "thanh toan")
        ):
            return (
                "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ. "
                "Với đơn hàng và ký quỹ (escrow), bạn làm theo các bước sau nhé ✅:\n"
                "1) Vào trang Chi tiết đơn hàng để xem trạng thái hiện tại.\n"
                "2) Bấm nút Nạp/Ký quỹ và làm theo hướng dẫn thanh toán.\n"
                "3) Chờ người bán xác nhận, hệ thống sẽ giữ tiền an toàn.\n"
                "4) Khi nhận hàng ok, bạn xác nhận hoàn tất để giải ngân cho người bán.\n"
                "Nếu bạn đang ở bước nào (nạp, chờ xác nhận hay nhận hàng), nói mình biết để mình hướng dẫn kỹ hơn nhé. "
                "Bạn có hài lòng với câu trả lời này không? "
                "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"
            )
        if pathname.startswith("/listings"):
            return (
                "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ. "
                "Để đăng tin nhanh và hiệu quả, bạn làm theo các bước sau nhé ✍️:\n"
                "1) Nhập tiêu đề rõ ràng (tên sản phẩm + tình trạng).\n"
                "2) Viết mô tả chi tiết (mẫu mã, phụ kiện, bảo hành nếu có).\n"
                "3) Chọn danh mục và tình trạng phù hợp.\n"
                "4) Nhập giá bán mong muốn (có thể tham khảo gợi ý).\n"
                "5) Thêm ảnh rõ, đủ góc, tránh mờ/thiếu sáng.\n"
                "6) Kiểm tra lại rồi bấm Đăng tin.\n"
                "Bạn muốn mình hướng dẫn kỹ hơn ở bước nào? "
                "Bạn có hài lòng với câu trả lời này không? "
                "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"
            )
        if pathname.startswith("/offers"):
            return (
                "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ. "
                "Ở luồng trả giá, bạn có thể làm như sau 💬:\n"
                "1) Vào chi tiết tin đăng và xem mức giá đề xuất.\n"
                "2) Gửi offer ở mức phù hợp với tình trạng thực tế.\n"
                "3) Theo dõi phản hồi từ người bán trong mục Đơn hàng/Trả giá.\n"
                "4) Nếu đạt thỏa thuận, tiến hành thanh toán/ký quỹ.\n"
                "Bạn muốn mình gợi ý mức offer theo tình trạng cụ thể không? "
                "Bạn có hài lòng với câu trả lời này không? "
                "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"
            )
        return (
            "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ. "
            "Mình có thể hướng dẫn bạn cách đăng tin, sửa tin, trả giá, và thao tác trong hệ thống ReHub. "
            "Bạn đang cần hướng dẫn bước nào (đăng tin, trả giá, thanh toán, ký quỹ, hay theo dõi đơn hàng)? "
            "Bạn có hài lòng với câu trả lời này không? "
            "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"
        )

    if intent == "inventory":
        return (
            "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ. "
            "Mình chưa đọc trực tiếp kho hàng theo thời gian thực trong chế độ fallback này. "
            "Bạn hãy gửi tên sản phẩm cụ thể (ví dụ: iPhone 13 128GB) hoặc từ khóa tìm kiếm, "
            "mình sẽ giúp bạn thu hẹp và hướng dẫn cách kiểm tra nhanh. "
            "Bạn có hài lòng với câu trả lời này không? "
            "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"
        )

    return (
        "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ. "
        "Bạn có thể hỏi về cách đăng tin, thao tác trong hệ thống, tìm sản phẩm, hoặc nhờ gợi ý giá bán cho món đồ bạn đang có. "
        "Bạn có hài lòng với câu trả lời này không? "
        "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"
    )


def _provider_is_configured() -> bool:
    return bool(settings.AI_API_KEY.strip()) and bool(settings.AI_PROVIDER_BASE_URL.strip()) and bool(settings.AI_CHAT_MODEL.strip())


def _chat_endpoint() -> str:
    base = settings.AI_PROVIDER_BASE_URL.rstrip("/")
    return f"{base}/chat/completions"


def _build_system_prompt(intent: AIIntent, pathname: str) -> str:
    base_prompt = (
        "Bạn là Trợ lý AI của ReHub Marketplace. Trả lời bằng tiếng Việt có dấu, lịch sự, thân thiện và có emoji phù hợp. "
        "Câu trả lời nên dài hơn mặc định, có hướng dẫn cụ thể theo từng bước. "
        "Câu trả lời PHẢI theo đúng cấu trúc sau:\n"
        "1) Mở đầu cảm ơn: 'Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ.'\n"
        "2) Nội dung trả lời theo ngữ cảnh và câu hỏi của người dùng, hướng dẫn rõ ràng từng bước (đánh số).\n"
        "3) Câu hỏi kiểm tra: 'Bạn có hài lòng với câu trả lời này không?'\n"
        "4) Lời nhắn cuối: 'Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!'\n"
        "Không bịa dữ liệu. Nếu thiếu thông tin thì hỏi lại 1 câu ngắn trong phần nội dung."
    )
    if intent == "pricing":
        return (
            base_prompt
            + " Người dùng đang hỏi gợi ý giá bán. Hãy tập trung vào việc ước giá hợp lý, nêu khoảng giá và nhắc nếu cần thêm model/tình trạng."
        )
    if intent == "howto":
        return (
            base_prompt
            + f" Người dùng đang ở ngữ cảnh trang {pathname}. Hãy hướng dẫn từng bước thao tác phù hợp với màn hình hiện tại."
        )
    if intent == "inventory":
        return (
            base_prompt
            + " Người dùng đang hỏi có sản phẩm nào hay không. Nếu không có dữ liệu trực tiếp thì nói rõ giới hạn và hướng dẫn cách tìm." 
        )
    return base_prompt


def _apply_response_template(content: str) -> str:
    greeting = "Cảm ơn bạn đã tin tưởng và sử dụng nền tảng ReHub để giao dịch đồ cũ."
    closing_question = "Bạn có hài lòng với câu trả lời này không?"
    closing_invite = "Nếu còn thắc mắc, bạn hãy hỏi lại tôi bất cứ khi nào bạn muốn nhé!"

    normalized = _normalize_text(content)
    if _normalize_text(greeting) in normalized:
        return content

    body = content.strip()
    return f"{greeting} {body} {closing_question} {closing_invite}"


def _expand_short_answer(intent: AIIntent, message: str, context: dict[str, str], answer: str) -> str:
    # If answer is already detailed, keep it.
    if len(answer) >= 420:
        return answer

    pathname = _current_path(context)
    normalized_message = _normalize_text(message)

    if intent == "howto":
        if pathname.startswith("/listings"):
            details = (
                "Bạn có thể làm theo checklist sau để đăng tin nhanh và hiệu quả ✍️:\n"
                "1) Tiêu đề rõ ràng: Tên sản phẩm + dung lượng/đời + tình trạng.\n"
                "2) Mô tả ngắn gọn: phụ kiện, bảo hành, lỗi/điểm trầy nếu có.\n"
                "3) Chọn danh mục và tình trạng chính xác.\n"
                "4) Nhập giá mong muốn và bật thương lượng nếu cần.\n"
                "5) Thêm 3–5 ảnh thật, đủ góc, ánh sáng tốt.\n"
                "6) Xem lại và bấm Đăng tin.\n"
                "Bạn đang vướng bước nào để mình hướng dẫn chi tiết hơn?"
            )
            return f"{answer}\n\n{details}"

        if pathname.startswith("/orders") or any(
            keyword in normalized_message
            for keyword in ("don hang", "ky quy", "nap ky quy", "escrow", "thanh toan")
        ):
            details = (
                "Mẹo nhanh cho luồng đơn hàng & ký quỹ ✅:\n"
                "1) Vào chi tiết đơn hàng để xem trạng thái.\n"
                "2) Bấm Nạp/Ký quỹ và hoàn tất thanh toán.\n"
                "3) Chờ người bán xác nhận, tiền được giữ an toàn.\n"
                "4) Khi nhận hàng ok, xác nhận hoàn tất để giải ngân.\n"
                "Bạn đang ở bước nào để mình hướng dẫn chuẩn nhất?"
            )
            return f"{answer}\n\n{details}"

        if pathname.startswith("/offers"):
            details = (
                "Gợi ý thao tác trả giá nhanh 💬:\n"
                "1) Xem giá đề xuất trong chi tiết tin.\n"
                "2) Gửi offer phù hợp với tình trạng thực tế.\n"
                "3) Theo dõi phản hồi trong mục Đơn hàng/Trả giá.\n"
                "4) Khi đồng ý, tiến hành ký quỹ/Thanh toán.\n"
                "Bạn muốn mình gợi ý mức offer theo tình trạng cụ thể không?"
            )
            return f"{answer}\n\n{details}"

        details = (
            "Bạn có thể hỏi theo từng mục nhé: Đăng tin, Trả giá, Thanh toán, Ký quỹ, hoặc Theo dõi đơn hàng. "
            "Bạn đang cần hướng dẫn phần nào?"
        )
        return f"{answer}\n\n{details}"

    if intent == "inventory":
        details = (
            "Bạn có thể gửi mình tên sản phẩm cụ thể (ví dụ: iPhone 13 128GB) hoặc từ khóa. "
            "Mình sẽ giúp bạn tìm nhanh và lọc theo tình trạng/phân khúc giá."
        )
        return f"{answer}\n\n{details}"

    return answer


async def _ask_provider(message: str, intent: AIIntent, context: dict[str, str]) -> str:
    timeout = httpx.Timeout(settings.AI_CHAT_TIMEOUT_SECONDS, connect=10.0)
    payload = {
        "model": settings.AI_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": _build_system_prompt(intent, _current_path(context))},
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


async def generate_ai_answer(message: str, context: dict[str, str] | None = None, mode: str = "auto") -> AiAnswer:
    context = context or {}
    intent = detect_intent(message, mode=mode)

    if intent == "pricing":
        engine = get_price_suggestion_engine()
        try:
            suggestion = engine.suggest(message, context=context)
            return AiAnswer(
                answer=compose_price_suggestion_reply(suggestion),
                provider=engine.provider_name,
                model=engine.model_name,
                intent=intent,
                fallback_used=False,
            )
        except PriceDatasetUnavailableError:
            return AiAnswer(
                answer=_fallback_answer(intent, message, context),
                provider="local-fallback",
                model="heuristic-v1",
                intent=intent,
                fallback_used=True,
            )

    if _provider_is_configured():
        try:
            raw_answer = await _ask_provider(message, intent, context)
            expanded = _expand_short_answer(intent, message, context, raw_answer)
            answer = _apply_response_template(expanded)
            return AiAnswer(
                answer=answer,
                provider=settings.AI_PROVIDER_NAME or "openai-compatible",
                model=settings.AI_CHAT_MODEL,
                intent=intent,
                fallback_used=False,
            )
        except HTTPException as exc:
            logger.warning("AI provider failed, falling back to local answer: %s", exc.detail)
            if not settings.AI_CHAT_FALLBACK_ENABLED:
                raise
        except Exception:
            logger.exception("Unexpected AI provider failure, falling back to local answer")
            if not settings.AI_CHAT_FALLBACK_ENABLED:
                raise HTTPException(status_code=502, detail="AI provider không phản hồi")

    return AiAnswer(
        answer=_fallback_answer(intent, message, context),
        provider="local-fallback",
        model="heuristic-v1",
        intent=intent,
        fallback_used=True,
    )