from __future__ import annotations

import csv
import re
import unicodedata
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path

from app.core.config import settings


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


def _percentile(sorted_values: list[int], percentile: float) -> int:
    if not sorted_values:
        raise ValueError("sorted_values must not be empty")
    if len(sorted_values) == 1:
        return sorted_values[0]
    index = (len(sorted_values) - 1) * percentile
    lower = int(index)
    upper = min(lower + 1, len(sorted_values) - 1)
    weight = index - lower
    value = sorted_values[lower] * (1 - weight) + sorted_values[upper] * weight
    return int(round(value / 1000.0) * 1000)


def _round_price(value: float) -> int:
    return int(round(value / 1000.0) * 1000)


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

    def suggest(self, query: str, context: dict[str, str] | None = None) -> PriceSuggestion:
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

        return PriceSuggestion(
            query=query,
            suggested_price=adjusted_suggested,
            price_low=adjusted_low,
            price_high=adjusted_high,
            confidence=round(confidence, 4),
            matched_count=len(top_matches),
            comparables=comparables,
            summary=summary,
        )


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