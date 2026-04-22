import uuid
from datetime import datetime, timezone

from sqlalchemy import or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.enums import FulfillmentStatus, ListingStatus, OrderStatus
from app.models.listing import Listing
from app.models.offer import Offer
from app.models.order import Order
from app.models.user import User


def _utc_now_naive() -> datetime:
	"""Return naive UTC datetime (compatible with 'timestamp without time zone')."""
	return datetime.now(timezone.utc).replace(tzinfo=None)


async def get_order_by_id(db: AsyncSession, order_id: uuid.UUID) -> Order | None:
	result = await db.execute(select(Order).where(Order.id == order_id))
	return result.scalar_one_or_none()


async def get_order_by_id_with_lock(db: AsyncSession, order_id: uuid.UUID) -> Order | None:
	result = await db.execute(
		select(Order)
		.where(Order.id == order_id)
		.with_for_update()
	)
	return result.scalar_one_or_none()


def set_order_status(order: Order, status: OrderStatus) -> None:
	order.status = status
	order.updated_at = _utc_now_naive()


def set_order_fulfillment_status(order: Order, status: FulfillmentStatus) -> None:
	order.fulfillment_status = status
	if status == FulfillmentStatus.SELLER_MARKED_DELIVERED:
		order.seller_marked_delivered_at = _utc_now_naive()
	if status == FulfillmentStatus.BUYER_CONFIRMED_RECEIVED:
		order.buyer_confirmed_received_at = _utc_now_naive()
	order.updated_at = _utc_now_naive()


async def get_user_orders(db: AsyncSession, user_id: uuid.UUID) -> list[Order]:
	result = await db.execute(
		select(Order).where(
			or_(Order.buyer_id == user_id, Order.seller_id == user_id)
		)
	)
	return list(result.scalars().all())


async def get_all_orders(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Order]:
	result = await db.execute(
		select(Order)
		.order_by(Order.created_at.desc())
		.offset(skip)
		.limit(limit)
	)
	return list(result.scalars().all())


async def create_direct_order(db: AsyncSession, buyer_id: uuid.UUID, listing_id: uuid.UUID) -> Order:
	"""
	Tạo order với SELECT FOR UPDATE để tránh race condition.
	Lock listing row trước khi kiểm tra và tạo order.

	Raises:
		ValueError: Nếu listing không tồn tại, không ACTIVE, hoặc buyer là seller.
	"""
	# SELECT FOR UPDATE để lock listing row
	result = await db.execute(
		select(Listing)
		.where(Listing.id == listing_id)
		.with_for_update()
	)
	listing = result.scalar_one_or_none()

	if not listing:
		raise ValueError("Listing not found")

	if listing.status != ListingStatus.ACTIVE:
		raise ValueError("Listing is not available for purchase")

	if listing.seller_id == buyer_id:
		raise ValueError("Cannot buy your own listing")

	# Tạo order và update listing trong cùng transaction
	order = Order(
		buyer_id=buyer_id,
		seller_id=listing.seller_id,
		listing_id=listing.id,
		final_price=listing.price,
		status=OrderStatus.PENDING,
		fulfillment_status=FulfillmentStatus.CREATED,
	)
	db.add(order)
	listing.status = ListingStatus.SOLD

	await db.commit()
	await db.refresh(order)
	return order


async def complete_order(db: AsyncSession, order: Order) -> Order:
	order.status = OrderStatus.COMPLETED
	order.fulfillment_status = FulfillmentStatus.BUYER_CONFIRMED_RECEIVED
	order.buyer_confirmed_received_at = _utc_now_naive()
	order.updated_at = _utc_now_naive()

	# Update seller's completed_orders
	await db.execute(
		update(User)
		.where(User.id == order.seller_id)
		.values(completed_orders=User.completed_orders + 1)
	)

	await db.commit()
	await db.refresh(order)
	return order


async def cancel_order(db: AsyncSession, order: Order, offer_id: uuid.UUID | None = None) -> Order:
	"""
	Cancel order và revert listing status về ACTIVE.
	Nếu order được tạo từ offer, cũng update offer status về REJECTED.
	"""
	from app.models.enums import OfferStatus

	order.status = OrderStatus.CANCELLED
	order.fulfillment_status = FulfillmentStatus.CANCELLED
	order.updated_at = _utc_now_naive()

	# Revert listing status to ACTIVE
	await db.execute(
		update(Listing)
		.where(Listing.id == order.listing_id)
		.values(status=ListingStatus.ACTIVE)
	)

	# Nếu có offer_id, update offer status về REJECTED
	if offer_id:
		await db.execute(
			update(Offer)
			.where(Offer.id == offer_id)
			.values(status=OfferStatus.REJECTED)
		)

	await db.commit()
	await db.refresh(order)
	return order


async def get_listing_for_order(db: AsyncSession, listing_id: uuid.UUID) -> Listing | None:
	"""Get listing by ID để trả về cho API layer."""
	result = await db.execute(select(Listing).where(Listing.id == listing_id))
	return result.scalar_one_or_none()
