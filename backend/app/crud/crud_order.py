import uuid
from datetime import datetime, timezone

from sqlalchemy import or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.enums import ListingStatus, OrderStatus, OfferStatus
from app.models.listing import Listing
from app.models.order import Order
from app.models.offer import Offer
from app.models.user import User


def utc_now() -> datetime:
    """
    Return timezone-naive UTC datetime for database compatibility.
    Database columns use TIMESTAMP WITHOUT TIME ZONE.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


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


async def get_user_orders_paginated(
    db: AsyncSession, user_id: uuid.UUID, skip: int = 0, limit: int = 20
) -> tuple[list[Order], int]:
    """Get paginated orders for a user (as buyer or seller)."""
    from sqlalchemy import func

    base_condition = or_(Order.buyer_id == user_id, Order.seller_id == user_id)

    # Count total
    count_result = await db.execute(
        select(func.count()).select_from(Order).where(base_condition)
    )
    total = count_result.scalar_one()

    # Get paginated items
    result = await db.execute(
        select(Order)
        .where(base_condition)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(result.scalars().all())

    return items, total


async def create_direct_order(
    db: AsyncSession, buyer_id: uuid.UUID, listing: Listing
) -> tuple[Order, list[Offer]]:
    """
    Create a direct order (Buy Now) with proper locking to prevent race conditions.

    Uses SELECT FOR UPDATE to lock the listing row, preventing concurrent purchases.

    Returns:
        tuple: (order, list_of_rejected_offers)

    Raises:
        ValueError: If listing is no longer available
    """
    # Lock the listing row to prevent concurrent purchases
    result = await db.execute(
        select(Listing)
        .where(Listing.id == listing.id)
        .with_for_update(nowait=False)  # Block until lock acquired
    )
    locked_listing = result.scalar_one_or_none()

    if not locked_listing:
        raise ValueError("Listing not found")

    # Re-check status after acquiring lock (double-check pattern)
    if locked_listing.status != ListingStatus.ACTIVE:
        raise ValueError("Listing is no longer available for purchase")

    # Now safe to proceed - create order
    order = Order(
        buyer_id=buyer_id,
        seller_id=locked_listing.seller_id,
        listing_id=locked_listing.id,
        final_price=locked_listing.price,
        status=OrderStatus.PENDING,
    )
    db.add(order)
    locked_listing.status = ListingStatus.SOLD

    # Reject all pending/countered offers on this listing (also with lock)
    result = await db.execute(
        select(Offer)
        .where(
            Offer.listing_id == locked_listing.id,
            Offer.status.in_([OfferStatus.PENDING, OfferStatus.COUNTERED])
        )
        .with_for_update()
    )
    rejected_offers = list(result.scalars().all())
    for offer in rejected_offers:
        offer.status = OfferStatus.REJECTED

    await db.commit()
    await db.refresh(order)
    return order, rejected_offers


async def complete_order(db: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.COMPLETED
    order.updated_at = utc_now()

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
    order.updated_at = utc_now()

    # Revert listing status to ACTIVE
    await db.execute(
        update(Listing)
        .where(Listing.id == order.listing_id)
        .values(status=ListingStatus.ACTIVE)
    )

    await db.commit()
    await db.refresh(order)
    return order
