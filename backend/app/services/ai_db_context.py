"""Service to enrich AI prompts with real product data from the database."""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass

from sqlalchemy import and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.category import Category
from app.models.enums import ListingStatus
from app.models.listing import Listing, ListingImage

logger = logging.getLogger(__name__)

# Vietnamese condition label mapping for human-friendly display
_CONDITION_LABELS = {
    "brand_new": "Mới 100%",
    "like_new": "Như mới",
    "good": "Tốt",
    "fair": "Trung bình",
    "poor": "Cũ",
}


@dataclass(slots=True)
class AiListingContext:
    """A simplified listing record used as AI context."""

    title: str
    price: int
    condition: str
    condition_label: str
    category_name: str | None
    description_snippet: str | None
    image_url: str | None
    listing_id: str


def _strip_accents(text: str) -> str:
    """Remove Vietnamese diacritics for fuzzy matching."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def extract_product_keywords(message: str) -> list[str]:
    """Extract searchable product keywords from a user message.

    Strategy:
    - Remove common Vietnamese filler / question words
    - Keep brand names, product names, specs (e.g. "iPhone 14 Pro Max 256GB")
    - Return a list of keyword phrases (may be a single phrase or multiple)
    """
    text = message.strip()

    # Remove common question / filler patterns (Vietnamese + ASCII-folded)
    _FILLER_PATTERNS = [
        r"\btoi\b", r"\btôi\b",
        r"\bminh\b", r"\bmình\b",
        r"\bmuon\b", r"\bmuốn\b",
        r"\bban\b", r"\bbán\b",
        r"\bmua\b",
        r"\bco\b", r"\bcó\b",
        r"\bkhong\b", r"\bkhông\b",
        r"\bcon\b", r"\bcòn\b",
        r"\bhang\b", r"\bhàng\b",
        r"\btim\b", r"\btìm\b",
        r"\bgia\b", r"\bgiá\b",
        r"\bbao nhieu\b", r"\bbao nhiêu\b",
        r"\btien\b", r"\btiền\b",
        r"\bnen\b", r"\bnên\b",
        r"\bdang\b", r"\bđang\b",
        r"\bla\b", r"\blà\b",
        r"\bnay\b", r"\bnày\b",
        r"\bthe nao\b", r"\bthế nào\b",
        r"\bcho\b",
        r"\bvoi\b", r"\bvới\b",
        r"\bnhu\b", r"\bnhư\b",
        r"\bthi\b", r"\bthì\b",
        r"\bsao\b",
        r"\bxin\b",
        r"\bcam on\b", r"\bcảm ơn\b",
        r"\bhoi\b", r"\bhỏi\b",
        r"\bgoi y\b", r"\bgợi ý\b",
        r"\bdinh gia\b", r"\bđịnh giá\b",
        r"\buoc gia\b", r"\bước giá\b",
        r"\bhop ly\b", r"\bhợp lý\b",
        r"\bsan pham\b", r"\bsản phẩm\b",
        r"\bdo cu\b", r"\bđồ cũ\b",
        r"\bduoc\b", r"\bđược\b",
        r"\bkhoan\b", r"\bkhoản\b",
        r"\bnhieu\b", r"\bnhiều\b",
    ]

    cleaned = text
    for pattern in _FILLER_PATTERNS:
        cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)

    # Collapse whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if not cleaned or len(cleaned) < 2:
        # If everything was stripped, fall back to the original
        cleaned = text

    # Split on common delimiters that separate product names
    parts = re.split(r"[,;/]", cleaned)
    keywords = [p.strip() for p in parts if len(p.strip()) >= 2]

    return keywords if keywords else [text.strip()]


async def search_listings_for_ai(
    db: AsyncSession,
    keywords: list[str],
    limit: int = 5,
) -> list[AiListingContext]:
    """Search active listings matching the given keywords and return simplified records."""
    if not keywords:
        return []

    # Build ILIKE conditions for each keyword against title and description
    keyword_conditions = []
    for kw in keywords:
        like_pattern = f"%{kw.strip()}%"
        keyword_conditions.append(
            or_(
                Listing.title.ilike(like_pattern),
                Listing.description.ilike(like_pattern),
            )
        )

    stmt = (
        select(
            Listing.id,
            Listing.title,
            Listing.price,
            Listing.condition_grade,
            Listing.description,
            Category.name.label("category_name"),
        )
        .join(Category, Category.id == Listing.category_id, isouter=True)
        .where(
            and_(
                Listing.status == ListingStatus.ACTIVE,
                or_(*keyword_conditions),
            )
        )
        .order_by(Listing.created_at.desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        return []

    # Batch-fetch primary images for matched listings
    listing_ids = [row.id for row in rows]
    img_stmt = (
        select(ListingImage.listing_id, ListingImage.image_url)
        .where(
            and_(
                ListingImage.listing_id.in_(listing_ids),
                ListingImage.is_primary == True,  # noqa: E712
            )
        )
    )
    img_result = await db.execute(img_stmt)
    primary_images: dict[str, str] = {
        str(row.listing_id): row.image_url for row in img_result.all()
    }

    listings: list[AiListingContext] = []
    for row in rows:
        condition_str = row.condition_grade if isinstance(row.condition_grade, str) else row.condition_grade.value
        desc_snippet = None
        if row.description:
            desc_snippet = row.description[:120].strip()
            if len(row.description) > 120:
                desc_snippet += "…"

        listings.append(
            AiListingContext(
                title=row.title,
                price=int(row.price),
                condition=condition_str,
                condition_label=_CONDITION_LABELS.get(condition_str, condition_str),
                category_name=row.category_name,
                description_snippet=desc_snippet,
                image_url=primary_images.get(str(row.id)),
                listing_id=str(row.id),
            )
        )

    return listings


def format_listings_for_prompt(listings: list[AiListingContext]) -> str:
    """Format DB listings into a text block that can be injected into the AI system prompt."""
    if not listings:
        return ""

    lines = ["Dữ liệu sản phẩm đang bán trên ReHub:"]
    for idx, item in enumerate(listings, 1):
        parts = [f"{idx}. {item.title}"]
        parts.append(f"   Giá: {item.price:,} VND")
        parts.append(f"   Tình trạng: {item.condition_label}")
        if item.category_name:
            parts.append(f"   Danh mục: {item.category_name}")
        if item.description_snippet:
            parts.append(f"   Mô tả: {item.description_snippet}")
        lines.append("\n".join(parts))

    lines.append(
        "\nHãy dựa vào dữ liệu thật trên để trả lời. "
        "Nếu user hỏi giá bán, hãy tham khảo giá các sản phẩm tương tự."
    )
    return "\n".join(lines)


def format_listings_as_reply(listings: list[AiListingContext], intent: str) -> str:
    """Format DB listings into a direct reply when LLM is unavailable (fallback mode)."""
    if not listings:
        if intent == "pricing":
            return (
                "Hiện tại trên ReHub chưa có sản phẩm tương tự để tham khảo giá. "
                "Bạn có thể đăng tin và đặt giá bạn mong muốn, người mua sẽ trả giá nếu quan tâm."
            )
        return (
            "Hiện tại trên ReHub chưa tìm thấy sản phẩm phù hợp với từ khóa của bạn. "
            "Bạn có thể thử tìm với từ khóa khác hoặc duyệt theo danh mục."
        )

    if intent == "pricing":
        prices = [item.price for item in listings]
        low = min(prices)
        high = max(prices)
        avg = sum(prices) // len(prices)

        lines = [
            f"Dựa trên {len(listings)} sản phẩm tương tự đang bán trên ReHub, "
            f"giá tham khảo khoảng **{low:,} — {high:,} VND** (trung bình {avg:,} VND).",
            "",
            "Một số sản phẩm tham khảo:",
        ]
        for item in listings[:5]:
            lines.append(
                f"• {item.title} — {item.price:,} VND ({item.condition_label})"
            )
        return "\n".join(lines)

    # intent == "inventory" or general
    lines = [f"Trên ReHub hiện có {len(listings)} sản phẩm phù hợp:", ""]
    for item in listings[:5]:
        parts = [f"• **{item.title}** — {item.price:,} VND"]
        parts.append(f"  Tình trạng: {item.condition_label}")
        if item.category_name:
            parts.append(f"  Danh mục: {item.category_name}")
        lines.append("\n".join(parts))

    return "\n".join(lines)
