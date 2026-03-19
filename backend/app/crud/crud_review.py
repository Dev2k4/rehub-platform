import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.review import Review
from app.models.user import User


async def get_review_by_order(db: AsyncSession, order_id: uuid.UUID) -> Review | None:
	result = await db.execute(select(Review).where(Review.order_id == order_id))
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

	await db.commit()
	await db.refresh(review)
	return review


async def get_user_reviews(db: AsyncSession, user_id: uuid.UUID) -> list[Review]:
	result = await db.execute(select(Review).where(Review.reviewee_id == user_id))
	return list(result.scalars().all())
