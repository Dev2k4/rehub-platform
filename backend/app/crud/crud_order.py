import uuid
from datetime import datetime

from sqlalchemy import or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.enums import ListingStatus, OrderStatus
from app.models.listing import Listing
from app.models.order import Order
from app.models.user import User


async def get_order_by_id(db: AsyncSession, order_id: uuid.UUID) -> Order | None:
	result = await db.execute(select(Order).where(Order.id == order_id))
	return result.scalar_one_or_none()


async def get_user_orders(db: AsyncSession, user_id: uuid.UUID) -> list[Order]:
	result = await db.execute(
		select(Order).where(
			or_(Order.buyer_id == user_id, Order.seller_id == user_id)
		)
	)
	return list(result.scalars().all())


async def create_direct_order(db: AsyncSession, buyer_id: uuid.UUID, listing: Listing) -> Order:
	order = Order(
		buyer_id=buyer_id,
		seller_id=listing.seller_id,
		listing_id=listing.id,
		final_price=listing.price,
		status=OrderStatus.PENDING,
	)
	db.add(order)
	listing.status = ListingStatus.SOLD
	await db.commit()
	await db.refresh(order)
	return order


async def complete_order(db: AsyncSession, order: Order) -> Order:
	order.status = OrderStatus.COMPLETED
	order.updated_at = datetime.utcnow()

	# Update seller's completed_orders
	await db.execute(
		update(User)
		.where(User.id == order.seller_id)
		.values(completed_orders=User.completed_orders + 1)
	)

	await db.commit()
	await db.refresh(order)
	return order


async def cancel_order(db: AsyncSession, order: Order) -> Order:
	order.status = OrderStatus.CANCELLED
	order.updated_at = datetime.utcnow()

	# Revert listing status to ACTIVE
	await db.execute(
		update(Listing)
		.where(Listing.id == order.listing_id)
		.values(status=ListingStatus.ACTIVE)
	)

	await db.commit()
	await db.refresh(order)
	return order
