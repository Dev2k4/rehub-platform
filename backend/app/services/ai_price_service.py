from __future__ import annotations

import csv
import json
import re
import unicodedata
import hashlib
import logging
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path
from typing import Dict, Any

import httpx

from app.core.config import settings

# Cache for price suggestions session consistency
_PRICE_CACHE: Dict[str, Any] = {}
logger = logging.getLogger(__name__)


def _get_price_cache_key(session_id: str | None, query: str, context: dict | None) -> str | None:
    if not session_id:
        return None
    # Normalize query
    q_norm = query.lower().strip()
    # Simplified context string
    ctx_str = ""
    if context:
        ctx_str = "|".join(f"{k}:{v}" for k, v in sorted(context.items()) if v)
    
    key_input = f"{q_norm}||{ctx_str}"
    h = hashlib.md5(key_input.encode("utf-8")).hexdigest()
    return f"{session_id}:price:{h}"


_STOPWORDS = {
    "a",
    "anh",
    "ban",
    "be",
    "bi",
    "cai",
    "can",
    "chi",
    "co",
    "con",
    "dang",
    "de",
    "gia",
    "hay",
    "ho",
    "hoac",
    "khi",
    "la",
    "len",
    "loai",
    "minh",
    "moi",
    "muon",
    "nao",
    "neu",
    "nhieu",
    "nhu",
    "nua",
    "oi",
    "sao",
    "sieu",
    "tai",
    "thi",
    "toi",
    "trong",
    "tuoi",
    "va",
    "ve",
    "voi",
    "xin",
    "xac",
}


_CONDITION_ALIASES = {
    "brand_new": {"brand new", "new", "moi", "moi 100", "mới", "new seal"},
    "like_new": {"like new", "hang dep", "dep", "cuc dep", "moi 99", "nhu moi", "như mới"},
    "good": {"good", "tot", "tot dep", "ok", "used good", "đẹp"},
    "fair": {"fair", "trung binh", "trung bình", "xuong", "xuong cap"},
    "poor": {"poor", "xau", "rat cu", "rất cũ", "cu"},
}

# Scaling factors to adjust 'new' prices from CSV according to reported condition
# These should be tuned by product category; defaults chosen as reasonable starting points.
_CONDITION_SCALE = {
    "brand_new": 1.00,
    "like_new": 0.95,
    "good": 0.85,
    "fair": 0.70,
    "poor": 0.50,
}


def _normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _tokenize(value: str) -> list[str]:
    tokens = []
    for token in _normalize_text(value).split():
        if len(token) < 2:
            continue
        if token in _STOPWORDS:
            continue
        tokens.append(token)
    return tokens


def _parse_price(value: str | int | float | Decimal | None) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value if value >= 0 else None
    if isinstance(value, float):
        if value < 0:
            return None
        return int(round(value))
    if isinstance(value, Decimal):
        if value < 0:
            return None
        return int(value.to_integral_value(rounding="ROUND_HALF_UP"))

    text = str(value).strip()
    if not text:
        return None

    cleaned = re.sub(r"[^\d.,-]", "", text)
    if not cleaned:
        return None
    cleaned = cleaned.replace(",", "")
    try:
        parsed = Decimal(cleaned)
    except InvalidOperation:
        return None
    if parsed < 0:
        return None
    return int(parsed.to_integral_value(rounding="ROUND_HALF_UP"))


def _round_price(value: float) -> int:
    """Round price to the nearest step (10,000 or 5,000 VND)."""
    val = float(value)
    if val >= 50000:
        # Round to nearest 10,000 for values >= 50,000
        return int(round(val / 10000.0) * 10000)
    # Round to nearest 5,000 for smaller values
    return int(round(val / 5000.0) * 5000)


def _percentile(sorted_values: list[int], percentile: float) -> int:
    if not sorted_values:
        raise ValueError("sorted_values must not be empty")
    if len(sorted_values) == 1:
        return _round_price(float(sorted_values[0]))
    index = (len(sorted_values) - 1) * percentile
    lower = int(index)
    upper = min(lower + 1, len(sorted_values) - 1)
    weight = index - lower
    value = sorted_values[lower] * (1 - weight) + sorted_values[upper] * weight
    return _round_price(value)


def _extract_condition(text: str | None) -> str | None:
    if not text:
        return None
    normalized = _normalize_text(text)
    for label, aliases in _CONDITION_ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                return label
    return None


@dataclass(slots=True)
class PriceComparable:
    title: str
    price: int
    category: str | None
    brand: str | None
    condition: str | None
    score: float


@dataclass(slots=True)
class PriceSuggestion:
    query: str
    suggested_price: int | None
    price_low: int | None
    price_high: int | None
    confidence: float
    matched_count: int
    comparables: list[PriceComparable]
    summary: str


@dataclass(slots=True)
class _PriceRecord:
    title: str
    price: int
    category: str | None
    brand: str | None
    condition: str | None
    tokens: frozenset[str]
    searchable_text: str


class PriceDatasetNotConfiguredError(RuntimeError):
    pass


class PriceDatasetUnavailableError(RuntimeError):
    pass


class PriceSuggestionProviderError(RuntimeError):
    pass


class PriceSuggestionEngine:
    def __init__(self, dataset_path: str, max_candidates: int, min_match_score: float) -> None:
        self.dataset_path = dataset_path.strip()
        self.max_candidates = max(1, max_candidates)
        self.min_match_score = max(0.0, min(min_match_score, 1.0))
        self._records: list[_PriceRecord] = []
        self._token_index: dict[str, set[int]] = {}
        self._loaded = False

    @property
    def provider_name(self) -> str:
        return "local-price-index"

    @property
    def model_name(self) -> str:
        return "csv-similarity-v1"

    @property
    def is_available(self) -> bool:
        return self._loaded and bool(self._records)

    def _candidate_columns(self, fieldnames: list[str]) -> dict[str, str | None]:
        normalized = {field: _normalize_text(field) for field in fieldnames}

        def pick(options: tuple[str, ...]) -> str | None:
            for field, norm in normalized.items():
                if norm in options:
                    return field
            return None

        return {
            "title": pick(("title", "name", "product", "product name", "product_name", "item", "item name", "item_name", "listing title", "listing_title")),
            "price": pick(("price", "gia", "gia ban", "sold price", "sold_price", "final price", "final_price", "amount", "value")),
            "category": pick(("category", "category name", "category_name", "type", "group", "nhom", "nhom hang")),
            "brand": pick(("brand", "brand name", "brand_name", "manufacturer", "hang", "thuong hieu")),
            "condition": pick(("condition", "condition grade", "condition_grade", "state", "status", "tinh trang", "tinh_trang")),
        }

    def _load_dataset(self) -> None:
        if self._loaded:
            return

        if not self.dataset_path:
            self._loaded = True
            return

        dataset_file = Path(self.dataset_path).expanduser()
        if not dataset_file.exists():
            self._loaded = True
            return

        with dataset_file.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                self._loaded = True
                return

            columns = self._candidate_columns(reader.fieldnames)
            for row in reader:
                title = (row.get(columns["title"] or "") or "").strip()
                price = _parse_price(row.get(columns["price"] or ""))
                if not title or price is None or price <= 0:
                    continue

                category = (row.get(columns["category"] or "") or "").strip() or None
                brand = (row.get(columns["brand"] or "") or "").strip() or None
                condition = (row.get(columns["condition"] or "") or "").strip() or None

                search_parts = [title]
                if brand:
                    search_parts.append(brand)
                if category:
                    search_parts.append(category)
                if condition:
                    search_parts.append(condition)

                searchable_text = _normalize_text(" ".join(search_parts))
                tokens = frozenset(_tokenize(searchable_text))
                if not tokens:
                    continue

                record = _PriceRecord(
                    title=title,
                    price=price,
                    category=category,
                    brand=brand,
                    condition=condition,
                    tokens=tokens,
                    searchable_text=searchable_text,
                )
                index = len(self._records)
                self._records.append(record)
                for token in tokens:
                    self._token_index.setdefault(token, set()).add(index)

        self._loaded = True

    def _gather_candidate_indexes(self, query_tokens: list[str], context_tokens: list[str]) -> set[int]:
        candidate_indexes: set[int] = set()
        for token in query_tokens + context_tokens:
            candidate_indexes.update(self._token_index.get(token, set()))
        return candidate_indexes

    def _score_record(
        self,
        record: _PriceRecord,
        query_text: str,
        query_tokens: list[str],
        context_tokens: list[str],
        query_condition: str | None,
    ) -> float:
        combined_tokens = set(query_tokens + context_tokens)
        if not combined_tokens:
            return 0.0

        overlap = len(combined_tokens.intersection(record.tokens)) / max(len(combined_tokens), len(record.tokens), 1)
        text_score = SequenceMatcher(None, query_text, record.searchable_text).ratio()

        bonus = 0.0
        if query_condition and record.condition:
            normalized_condition = _normalize_text(record.condition)
            if query_condition == _extract_condition(normalized_condition):
                bonus += 0.15

        if record.brand and _normalize_text(record.brand) in combined_tokens:
            bonus += 0.1
        if record.category and _normalize_text(record.category) in combined_tokens:
            bonus += 0.08

        return overlap * 0.55 + text_score * 0.35 + bonus

    def suggest(
        self, query: str, context: dict[str, str] | None = None, session_id: str | None = None
    ) -> PriceSuggestion:
        # Check cache
        cache_key = _get_price_cache_key(session_id, query, context)
        if cache_key and cache_key in _PRICE_CACHE:
            return _PRICE_CACHE[cache_key]

        self._load_dataset()
        if not self._records:
            raise PriceDatasetUnavailableError("Price dataset is not configured or contains no valid rows")

        context = context or {}
        query_text = _normalize_text(query)
        query_tokens = _tokenize(query_text)
        context_text = " ".join(
            value for value in [context.get("category"), context.get("brand"), context.get("condition")]
            if value
        )
        context_tokens = _tokenize(context_text)
        query_condition = _extract_condition(query)
        if not query_condition:
            query_condition = _extract_condition(context.get("condition"))

        candidate_indexes = self._gather_candidate_indexes(query_tokens, context_tokens)
        if not candidate_indexes:
            return PriceSuggestion(
                query=query,
                suggested_price=None,
                price_low=None,
                price_high=None,
                confidence=0.0,
                matched_count=0,
                comparables=[],
                summary="Không tìm được sản phẩm tương tự đủ gần để gợi ý giá. Hãy bổ sung tên, hãng hoặc tình trạng sản phẩm.",
            )

        scored: list[tuple[float, _PriceRecord]] = []
        for index in candidate_indexes:
            record = self._records[index]
            score = self._score_record(record, query_text, query_tokens, context_tokens, query_condition)
            if score >= self.min_match_score:
                scored.append((score, record))

        if not scored:
            return PriceSuggestion(
                query=query,
                suggested_price=None,
                price_low=None,
                price_high=None,
                confidence=0.0,
                matched_count=0,
                comparables=[],
                summary="Có dữ liệu liên quan nhưng chưa khớp đủ tốt để ước giá. Hãy mô tả rõ hơn model, dung lượng hoặc tình trạng.",
            )

        scored.sort(key=lambda item: item[0], reverse=True)
        top_matches = scored[: self.max_candidates]
        prices = [record.price for _, record in top_matches]
        if not prices:
            return PriceSuggestion(
                query=query,
                suggested_price=None,
                price_low=None,
                price_high=None,
                confidence=0.0,
                matched_count=len(top_matches),
                comparables=[],
                summary="Không trích xuất được giá hợp lệ từ dữ liệu tương tự.",
            )

        comparable_prices = sorted(prices)
        if len(comparable_prices) >= 3:
            low_price = _percentile(comparable_prices, 0.25)
            high_price = _percentile(comparable_prices, 0.75)
        else:
            low_price = min(comparable_prices)
            high_price = max(comparable_prices)

        weighted_sum = 0.0
        total_weight = 0.0
        for score, record in top_matches:
            weight = max(score, 0.01)
            weighted_sum += record.price * weight
            total_weight += weight

        suggested_price = _round_price(weighted_sum / total_weight) if total_weight else None
        best_score = top_matches[0][0]
        confidence = min(1.0, max(0.05, best_score * 0.75 + min(len(top_matches), 8) * 0.04))

        comparables = [
            PriceComparable(
                title=record.title,
                price=record.price,
                category=record.category,
                brand=record.brand,
                condition=record.condition,
                score=round(score, 4),
            )
            for score, record in top_matches
        ]

        summary = (
            f"Đã so khớp {len(top_matches)} sản phẩm tương tự. "
            f"Giá gợi ý cơ sở (tình trạng " + (query_condition or "không rõ") + ") khoảng {low_price:,} - {high_price:,} VND, "
            f"giá đăng nhanh cơ sở khoảng {suggested_price:,} VND."
        )

        # If user provided a condition that is not 'brand_new' (new), adjust the
        # computed prices using the canonical scaling factors. We keep the
        # original comparables prices untouched but return adjusted range
        # and suggested price so the frontend can present an appropriate box.
        adjusted_low = low_price
        adjusted_high = high_price
        adjusted_suggested = suggested_price
        if query_condition:
            scale = _CONDITION_SCALE.get(query_condition, 1.0)
            try:
                adjusted_low = _round_price(adjusted_low * scale) if adjusted_low is not None else None
                adjusted_high = _round_price(adjusted_high * scale) if adjusted_high is not None else None
                adjusted_suggested = _round_price(adjusted_suggested * scale) if adjusted_suggested is not None else None
                summary += f"\n(Đã điều chỉnh theo tình trạng '{query_condition}': {int(scale*100)}% của giá mới.)"
            except Exception:
                # On any rounding/None issues, leave adjusted values as originals
                adjusted_low = low_price
                adjusted_high = high_price
                adjusted_suggested = suggested_price

        res_obj = PriceSuggestion(
            query=query,
            suggested_price=adjusted_suggested,
            price_low=adjusted_low,
            price_high=adjusted_high,
            confidence=round(confidence, 4),
            matched_count=len(top_matches),
            comparables=comparables,
            summary=summary,
        )
        if cache_key:
            _PRICE_CACHE[cache_key] = res_obj
        return res_obj


@lru_cache(maxsize=4)
def get_price_suggestion_engine(dataset_path: str | None = None) -> PriceSuggestionEngine:
    return PriceSuggestionEngine(
        dataset_path=dataset_path if dataset_path is not None else settings.AI_PRICE_DATASET_PATH,
        max_candidates=settings.AI_PRICE_MAX_CANDIDATES,
        min_match_score=settings.AI_PRICE_MIN_MATCH_SCORE,
    )


def compose_price_suggestion_reply(suggestion: PriceSuggestion) -> str:
    if suggestion.suggested_price is None:
        return suggestion.summary

    comparable_lines = []
    for item in suggestion.comparables[:3]:
        descriptor = item.title
        if item.brand:
            descriptor = f"{item.brand} - {descriptor}"
        if item.condition:
            descriptor = f"{descriptor} ({item.condition})"
        comparable_lines.append(f"- {descriptor}: {item.price:,} VND")

    comparable_text = "\n".join(comparable_lines)
    parts = [
        suggestion.summary,
        f"Độ tin cậy: {int(round(suggestion.confidence * 100))}%.",
    ]
    if comparable_text:
        parts.append("Một vài sản phẩm tương tự:")
        parts.append(comparable_text)
    return "\n".join(parts)


def _ai_provider_is_configured() -> bool:
    return bool(settings.AI_API_KEY.strip()) and bool(settings.AI_PROVIDER_BASE_URL.strip()) and bool(settings.AI_CHAT_MODEL.strip())


def _ai_chat_endpoint() -> str:
    base = settings.AI_PROVIDER_BASE_URL.rstrip("/")
    return f"{base}/chat/completions"


def _supports_response_format() -> bool:
    provider = (settings.AI_PROVIDER_NAME or "").lower()
    return "openai" in provider or "9router" in provider


def _condition_label_for_prompt(condition: str | None) -> str:
    if not condition:
        return ""
    normalized = condition.strip().lower()
    mapping = {
        "brand_new": "Moi 100%",
        "like_new": "Nhu moi",
        "good": "Tot",
        "fair": "Trung binh",
        "poor": "Cu",
        "new": "Moi 100%",
        "like new": "Nhu moi",
    }
    return mapping.get(normalized, condition)


def _build_ai_price_prompts(query: str, context: dict[str, str] | None) -> tuple[str, str]:
    context = context or {}
    condition_label = _condition_label_for_prompt(context.get("condition"))
    category = (context.get("category") or "").strip()
    brand = (context.get("brand") or "").strip()

    system_prompt = (
        "Ban la chuyen gia dinh gia do cu tren san ReHub tai Viet Nam. "
        "Hay dua ra muc gia goi y phu hop dua tren tieu de, mo ta va tinh trang. "
        "Tra ve DUY NHAT mot JSON object (khong text thuong). "
        "Cac truong bat buoc: suggested_price, price_low, price_high, confidence, summary. "
        "Gia la so nguyen VND, khong dung dau phay/chu phan tach; confidence la so trong khoang 0-1. "
        "Dam bao price_low <= suggested_price <= price_high. "
        "Vi du dinh dang: {\"suggested_price\": 12000000, \"price_low\": 11000000, \"price_high\": 13000000, \"confidence\": 0.62, \"summary\": \"Gia tham khao cho tinh trang tot.\"}"
    )

    user_prompt = (
        f"Tieu de: {query}\n"
        f"Danh muc: {category or 'Khong ro'}\n"
        f"Thuong hieu: {brand or 'Khong ro'}\n"
        f"Tinh trang: {condition_label or 'Khong ro'}\n"
        "Yeu cau: dinh gia nhanh, hop ly, phu hop voi thi truong secondhand Viet Nam."
    )

    return system_prompt, user_prompt


def _extract_json_object(text: str) -> dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("AI response does not contain JSON object")
    snippet = text[start : end + 1]
    return json.loads(snippet)


def _extract_price_from_text(text: str) -> int | None:
    matches = re.findall(r"\d[\d.,]{2,}", text)
    if not matches:
        return None
    return _parse_price(matches[0])


def _coerce_confidence(value: Any) -> float:
    try:
        val = float(value)
    except (TypeError, ValueError):
        return 0.45
    return max(0.05, min(1.0, val))


async def _ask_ai_price_provider(query: str, context: dict[str, str] | None) -> dict[str, Any]:
    if not _ai_provider_is_configured():
        raise PriceSuggestionProviderError("AI provider chua cau hinh")

    system_prompt, user_prompt = _build_ai_price_prompts(query, context)
    payload = {
        "model": settings.AI_CHAT_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 250,
        "max_output_tokens": 250,
    }
    if _supports_response_format():
        payload["response_format"] = {"type": "json_object"}
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }

    timeout = httpx.Timeout(settings.AI_CHAT_TIMEOUT_SECONDS, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(_ai_chat_endpoint(), json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise PriceSuggestionProviderError(f"Khong the ket noi AI provider: {exc}") from exc

    if response.status_code >= 400:
        detail = "AI provider tra loi loi"
        try:
            payload_json = response.json()
            detail = payload_json.get("error", {}).get("message") or payload_json.get("message") or detail
        except Exception:
            pass
        raise PriceSuggestionProviderError(detail)

    data = response.json()
    content = _extract_ai_content(data)
    if not isinstance(content, str) or not content.strip():
        logger.warning("AI price response missing content. Keys: %s", list(data.keys()))
        raise PriceSuggestionProviderError("AI provider khong tra ve noi dung")

    try:
        return _extract_json_object(content)
    except Exception as exc:
        fallback_price = _extract_price_from_text(content)
        if fallback_price is not None:
            return {"suggested_price": fallback_price}

        logger.warning("Failed to parse AI price JSON: %s. Content: %s", exc, content[:500])
        snippet = content.strip().replace("\n", " ")[:500]
        raise PriceSuggestionProviderError(
            f"AI provider tra ve dinh dang du lieu khong hop le. Noi dung: {snippet}"
        ) from exc


def _extract_ai_content(data: dict[str, Any]) -> str | None:
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        for choice in choices:
            if not isinstance(choice, dict):
                continue
            message = choice.get("message")
            if isinstance(message, dict):
                content = message.get("content")
                if isinstance(content, str) and content.strip():
                    return content
                if isinstance(content, list):
                    text_parts = [part.get("text", "") for part in content if isinstance(part, dict)]
                    joined = "".join(text_parts).strip()
                    if joined:
                        return joined
            text = choice.get("text")
            if isinstance(text, str) and text.strip():
                return text
            delta = choice.get("delta")
            if isinstance(delta, dict):
                delta_content = delta.get("content")
                if isinstance(delta_content, str) and delta_content.strip():
                    return delta_content

    direct_fields = ["content", "output_text", "response", "text"]
    for field in direct_fields:
        value = data.get(field)
        if isinstance(value, str) and value.strip():
            return value

    return None


async def suggest_price_with_ai(
    query: str,
    context: dict[str, str] | None = None,
    session_id: str | None = None,
) -> PriceSuggestion:
    cache_key = _get_price_cache_key(session_id, query, context)
    if cache_key and cache_key in _PRICE_CACHE:
        return _PRICE_CACHE[cache_key]

    payload = await _ask_ai_price_provider(query, context)

    suggested = _parse_price(payload.get("suggested_price"))
    price_low = _parse_price(payload.get("price_low"))
    price_high = _parse_price(payload.get("price_high"))
    confidence = _coerce_confidence(payload.get("confidence"))
    summary = str(payload.get("summary") or "Goi y AI dua tren thong tin tin dang da cung cap.")

    if suggested is None and price_low is not None and price_high is not None:
        suggested = _round_price((price_low + price_high) / 2)

    if suggested is None:
        raise PriceSuggestionProviderError("AI khong tra ve gia hop le")

    if price_low is None and price_high is None:
        price_low = _round_price(suggested * 0.9)
        price_high = _round_price(suggested * 1.1)
    elif price_low is None:
        price_low = _round_price(min(suggested, price_high or suggested) * 0.9)
    elif price_high is None:
        price_high = _round_price(max(suggested, price_low or suggested) * 1.1)

    if price_low is not None and price_high is not None and price_low > price_high:
        price_low, price_high = price_high, price_low

    suggested = _round_price(suggested)
    if price_low is not None:
        price_low = _round_price(price_low)
    if price_high is not None:
        price_high = _round_price(price_high)

    res_obj = PriceSuggestion(
        query=query,
        suggested_price=suggested,
        price_low=price_low,
        price_high=price_high,
        confidence=round(confidence, 4),
        matched_count=1,
        comparables=[],
        summary=summary,
    )

    if cache_key:
        _PRICE_CACHE[cache_key] = res_obj
    return res_obj