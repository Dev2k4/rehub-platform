import uuid
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import and_
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
    """Get first review for an order (for backwards compatibility)."""
    result = await db.execute(select(Review).where(Review.order_id == order_id))
    return result.scalar_one_or_none()


async def get_review_by_order_and_reviewer(db: AsyncSession, order_id: uuid.UUID, reviewer_id: uuid.UUID) -> Review | None:
    """Check if a specific user has already reviewed this order."""
    result = await db.execute(
        select(Review).where(
            and_(Review.order_id == order_id, Review.reviewer_id == reviewer_id)
        )
    )
    return result.scalar_one_or_none()


async def create_review(
    db: AsyncSession,
    order_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    reviewee_id: uuid.UUID,
    rating: int,
    comment: str | None
) -> Review:
    review = Review(
        order_id=order_id,
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        rating=rating,
        comment=comment,
    )
    db.add(review)

    # Update user stats
    result = await db.execute(select(User).where(User.id == reviewee_id))
    user = result.scalar_one_or_none()
    if user:
        old_avg = float(user.rating_avg)
        old_count = user.rating_count
        new_count = old_count + 1
        new_avg = ((old_avg * old_count) + rating) / new_count
        user.rating_count = new_count
        user.rating_avg = Decimal(str(round(new_avg, 2)))
        # Calculate and update trust_score
        user.trust_score = calculate_trust_score(user)

    await db.commit()
    await db.refresh(review)
    return review


async def get_user_reviews(db: AsyncSession, user_id: uuid.UUID) -> list[Review]:
	result = await db.execute(select(Review).where(Review.reviewee_id == user_id))
	return list(result.scalars().all())
