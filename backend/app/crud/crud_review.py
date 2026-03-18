import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.review import Review


async def get_review_by_order(db: AsyncSession, order_id: uuid.UUID) -> Optional[Review]:
	result = await db.execute(select(Review).where(Review.order_id == order_id))
	return result.scalar_one_or_none()
