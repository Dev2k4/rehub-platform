import uuid
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.review import Review
from app.models.user import User


def calculate_trust_score(user: User) -> Decimal:
    """
    Calculate trust score based on:
    - completed_orders * 2
    - rating_avg * 10
    - min(account_age_months, 12)
    """
    score = float(user.completed_orders) * 2
    score += float(user.rating_avg) * 10
    account_age_days = (datetime.now(timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)).days
    account_age_months = account_age_days / 30
    score += min(account_age_months, 12)
    return Decimal(str(round(score, 1)))


async def get_review_by_order(db: AsyncSession, order_id: uuid.UUID) -> Review | None:
    """Lấy 1 review bất kỳ cho order (deprecated - dùng get_review_by_order_and_reviewer)."""
    result = await db.execute(select(Review).where(Review.order_id == order_id))
    return result.scalar_one_or_none()


async def get_review_by_order_and_reviewer(
    db: AsyncSession, order_id: uuid.UUID, reviewer_id: uuid.UUID
) -> Review | None:
    """Kiểm tra xem reviewer đã review order này chưa."""
    result = await db.execute(
        select(Review).where(
            and_(
                Review.order_id == order_id,
                Review.reviewer_id == reviewer_id,
            )
        )
    )
    return result.scalar_one_or_none()


async def get_reviews_by_order(db: AsyncSession, order_id: uuid.UUID) -> list[Review]:
    """Lấy tất cả reviews cho 1 order (có thể có 2: từ buyer và seller)."""
    result = await db.execute(select(Review).where(Review.order_id == order_id))
    return list(result.scalars().all())


async def create_review(
    db: AsyncSession,
    order_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    reviewee_id: uuid.UUID,
    rating: int,
    comment: str | None,
) -> Review:
    """
    Tạo review với atomic update cho rating.
    Sử dụng SQL expression để tránh race condition.
    """
    # Lock user row trước khi update rating
    result = await db.execute(
        select(User)
        .where(User.id == reviewee_id)
        .with_for_update()
    )
    user = result.scalar_one_or_none()

    if not user:
        raise ValueError("Reviewee not found")

    # Tạo review
    review = Review(
        order_id=order_id,
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        rating=rating,
        comment=comment,
    )
    db.add(review)

    # Atomic update user rating sử dụng SQL expression
    # new_avg = (old_avg * old_count + new_rating) / (old_count + 1)
    old_count = user.rating_count
    old_avg = float(user.rating_avg)
    new_count = old_count + 1

    # Tính toán new_avg
    if old_count == 0:
        new_avg = float(rating)
    else:
        new_avg = ((old_avg * old_count) + rating) / new_count

    # Update với values đã tính
    await db.execute(
        update(User)
        .where(User.id == reviewee_id)
        .values(
            rating_count=new_count,
            rating_avg=Decimal(str(round(new_avg, 2))),
        )
    )

    await db.commit()
    await db.refresh(review)
    return review


async def get_user_reviews(db: AsyncSession, user_id: uuid.UUID) -> list[Review]:
    """Lấy tất cả reviews mà user nhận được."""
    result = await db.execute(
        select(Review)
        .where(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
    )
    return list(result.scalars().all())