import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.models.order import Order


async def get_order_by_id(db: AsyncSession, order_id: uuid.UUID) -> Optional[Order]:
	result = await db.execute(select(Order).where(Order.id == order_id))
	return result.scalar_one_or_none()


async def get_user_orders(db: AsyncSession, user_id: uuid.UUID) -> list[Order]:
	result = await db.execute(
		select(Order).where(
			or_(Order.buyer_id == user_id, Order.seller_id == user_id)
		)
	)
	return list(result.scalars().all())
