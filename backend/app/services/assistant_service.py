import re
import uuid
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import crud_listing, crud_review
from app.models.enums import ListingStatus
from app.models.listing import Listing
from app.models.user import User
from app.schemas.assistant import (
    AssistantListingCandidate,
    AssistantQueryResponse,
    AssistantSellerInsight,
)
from app.services.assistant_ai_provider import build_grounded_prompt, get_ai_provider

_PRICE_TOKEN = re.compile(r"(\d+(?:[\.,]\d+)?)\s*(trieu|tr|k|nghin)?", re.IGNORECASE)
_UUID_TOKEN = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")


def _to_amount(raw_value: str, unit: str | None) -> float:
    normalized = raw_value.replace(",", ".")
    value = float(normalized)
    unit_normalized = (unit or "").lower()
    if unit_normalized in {"trieu", "tr"}:
        return value * 1_000_000
    if unit_normalized in {"k", "nghin"}:
        return value * 1_000
    return value


def detect_intent(message: str) -> str:
    text = message.lower()
    if any(
        keyword in text
        for keyword in [
            "uy tin",
            "uy tín",
            "tin cay",
            "tin cậy",
            "danh gia",
            "đánh giá",
            "trust",
            "seller",
        ]
    ):
        return "seller_reputation"
    if any(
        keyword in text
        for keyword in ["gia", "giá", "khoang", "khoảng", "tam", "tầm", "den", "đến", "tu", "từ"]
    ):
        return "listing_price_range"
    return "listing_search"


def extract_price_range(message: str) -> tuple[float | None, float | None]:
    matches = _PRICE_TOKEN.findall(message)
    if not matches:
        return None, None

    amounts = [_to_amount(raw_value, unit) for raw_value, unit in matches]
    if len(amounts) >= 2 and any(token in message.lower() for token in ["den", "-"]):
        low = min(amounts[0], amounts[1])
        high = max(amounts[0], amounts[1])
        return low, high

    if len(amounts) >= 1:
        target = amounts[0]
        return target * 0.8, target * 1.2

    return None, None


def extract_keyword(message: str) -> str | None:
    cleaned = message.lower()
    for token in [
        "toi muon tim",
        "tôi muốn tìm",
        "co",
        "có",
        "gia",
        "giá",
        "khoang",
        "khoảng",
        "tam",
        "tầm",
        "den",
        "đến",
        "tu",
        "từ",
        "khong",
        "không",
        "ban",
        "bạn",
        "duoc",
        "được",
        "hay",
        "la",
        "là",
        "nao",
        "nào",
        "khong",
        "nguoi dung",
        "người dùng",
        "uy tin",
        "uy tín",
        "danh gia",
        "đánh giá",
        "co ban khong",
        "có bán không",
    ]:
        cleaned = cleaned.replace(token, " ")
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) < 2:
        return None
    return cleaned


def _build_match_reason(
    *,
    listing: Listing,
    keyword: str | None,
    min_price: float | None,
    max_price: float | None,
) -> str:
    reasons: list[str] = []
    if keyword and keyword.lower() in listing.title.lower():
        reasons.append("khop tu khoa")

    price_value = float(listing.price)
    if min_price is not None and max_price is not None and min_price <= price_value <= max_price:
        reasons.append("nam trong khoang gia")

    reasons.append(f"tinh trang {listing.condition_grade}")
    return ", ".join(reasons)


async def _listing_to_candidate(db: AsyncSession, listing: Listing) -> AssistantListingCandidate:
    seller_result = await db.execute(select(User).where(User.id == listing.seller_id))
    seller = seller_result.scalar_one()
    images = await crud_listing.get_listing_images(db, str(listing.id))
    image_url = None
    if images:
        primary = next((img for img in images if img.is_primary), images[0])
        image_url = primary.thumbnail_url or primary.image_url

    return AssistantListingCandidate(
        id=listing.id,
        title=listing.title,
        price=Decimal(listing.price),
        condition_grade=str(listing.condition_grade),
        status=str(listing.status),
        seller_id=listing.seller_id,
        seller_name=seller.full_name,
        province=seller.province,
        district=seller.district,
        trust_score=float(seller.trust_score),
        rating_avg=float(seller.rating_avg),
        rating_count=seller.rating_count,
        completed_orders=seller.completed_orders,
        image_url=image_url,
    )


async def _build_seller_insight(db: AsyncSession, message: str) -> AssistantSellerInsight | None:
    uuid_match = _UUID_TOKEN.search(message)
    user: User | None = None
    if uuid_match:
        user_id = uuid.UUID(uuid_match.group(0))
        result = await db.execute(select(User).where(and_(User.id == user_id, User.is_active.is_(True))))
        user = result.scalar_one_or_none()
    else:
        marker = re.search(r"(?:nguoi dung|seller|user)\s+(.+?)\s*(?:co uy tin|co dang tin|khong\?|$)", message, re.IGNORECASE)
        if marker:
            name = marker.group(1).strip()
            result = await db.execute(
                select(User)
                .where(and_(func.lower(User.full_name).like(f"%{name.lower()}%"), User.is_active.is_(True)))
                .limit(1)
            )
            user = result.scalar_one_or_none()

    if not user:
        return None

    reviews = await crud_review.get_user_reviews(db, user.id)
    snippets = [review.comment for review in reviews if review.comment][:3]

    return AssistantSellerInsight(
        user_id=user.id,
        full_name=user.full_name,
        trust_score=float(user.trust_score),
        rating_avg=float(user.rating_avg),
        rating_count=user.rating_count,
        completed_orders=user.completed_orders,
        review_summary=snippets,
    )


async def run_assistant_query(
    *,
    db: AsyncSession,
    message: str,
    max_results: int,
) -> AssistantQueryResponse:
    intent = detect_intent(message)
    min_price, max_price = extract_price_range(message)
    keyword = extract_keyword(message)

    listings: list[AssistantListingCandidate] = []
    seller_insight: AssistantSellerInsight | None = None

    if intent in {"listing_search", "listing_price_range"}:
        rows, _ = await crud_listing.search_listings(
            db,
            keyword=keyword,
            min_price=min_price,
            max_price=max_price,
            status=ListingStatus.ACTIVE,
            limit=max_results,
        )
        listings = []
        for row in rows:
            candidate = await _listing_to_candidate(db, row)
            candidate.match_reason = _build_match_reason(
                listing=row,
                keyword=keyword,
                min_price=min_price,
                max_price=max_price,
            )
            listings.append(candidate)

    if intent == "seller_reputation":
        seller_insight = await _build_seller_insight(db, message)

    retrieval_context = {
        "intent": intent,
        "query": message,
        "price_range": {"min": min_price, "max": max_price},
        "listings": [item.model_dump(mode="json") for item in listings],
        "seller_insight": seller_insight.model_dump(mode="json") if seller_insight else None,
    }

    provider = get_ai_provider()
    answer = await provider.generate_answer(
        prompt=build_grounded_prompt(question=message, retrieval_context=retrieval_context)
    )

    follow_up = [
        "Ban co muon toi loc ket qua theo tinh trang san pham khong?",
        "Ban co muon thu hep khoang gia de tim sat hon khong?",
    ]
    if intent == "seller_reputation":
        follow_up = [
            "Ban co muon xem them review gan day cua nguoi ban nay khong?",
            "Ban co muon toi goi y seller khac co trust score cao hon khong?",
        ]

    confidence = 0.75
    if intent == "seller_reputation" and not seller_insight:
        confidence = 0.35
    if intent in {"listing_search", "listing_price_range"} and not listings:
        confidence = 0.4

    return AssistantQueryResponse(
        answer=answer,
        intent=intent,
        confidence=confidence,
        listings=listings,
        seller_insight=seller_insight,
        follow_up_questions=follow_up,
    )
