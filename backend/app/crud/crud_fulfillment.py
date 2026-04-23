import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud import crud_escrow, crud_order
from app.models.enums import (
    EscrowEventType,
    EscrowStatus,
    FulfillmentEventType,
    FulfillmentStatus,
    OrderStatus,
)
from app.models.escrow import EscrowEvent
from app.models.fulfillment import Fulfillment, FulfillmentEvent
from app.models.order import Order


def _utc_now_naive() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def get_fulfillment_by_order_id(db: AsyncSession, order_id: uuid.UUID) -> Fulfillment | None:
    result = await db.execute(select(Fulfillment).where(Fulfillment.order_id == order_id))
    return result.scalar_one_or_none()


async def get_fulfillment_by_order_id_with_lock(db: AsyncSession, order_id: uuid.UUID) -> Fulfillment | None:
    result = await db.execute(
        select(Fulfillment)
        .where(Fulfillment.order_id == order_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def create_fulfillment_for_order(db: AsyncSession, order: Order) -> Fulfillment:
    existing = await get_fulfillment_by_order_id(db, order.id)
    if existing:
        return existing

    fulfillment = Fulfillment(
        order_id=order.id,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        status=FulfillmentStatus.PENDING_SELLER_START,
    )
    db.add(fulfillment)
    await db.flush()

    db.add(
        FulfillmentEvent(
            fulfillment_id=fulfillment.id,
            actor_id=order.seller_id,
            event_type=FulfillmentEventType.CREATED,
            note="Fulfillment created for order",
            data={"order_id": str(order.id)},
        )
    )

    await db.commit()
    await db.refresh(fulfillment)
    return fulfillment


async def seller_start_preparing(db: AsyncSession, order_id: uuid.UUID, seller_id: uuid.UUID) -> Fulfillment:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    fulfillment = await get_fulfillment_by_order_id_with_lock(db, order_id)
    if not fulfillment:
        raise ValueError("Fulfillment not found for this order")

    if order.seller_id != seller_id:
        raise ValueError("Only seller can start preparing")

    if fulfillment.status != FulfillmentStatus.PENDING_SELLER_START:
        raise ValueError(f"Cannot start preparing in {fulfillment.status} state")

    escrow = await crud_escrow.get_escrow_by_order_id_with_lock(db, order_id)
    if escrow and escrow.status != EscrowStatus.HELD:
        raise ValueError("Escrow must be funded before seller starts delivery")

    fulfillment.status = FulfillmentStatus.PREPARING
    fulfillment.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.PREPARING)

    db.add(
        FulfillmentEvent(
            fulfillment_id=fulfillment.id,
            actor_id=seller_id,
            event_type=FulfillmentEventType.SELLER_START_PREPARING,
            note="Seller started preparing package",
            data={"order_id": str(order.id)},
        )
    )

    await db.commit()
    await db.refresh(fulfillment)
    return fulfillment


async def seller_mark_shipping(
    db: AsyncSession,
    order_id: uuid.UUID,
    seller_id: uuid.UUID,
    note: str | None = None,
) -> Fulfillment:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    fulfillment = await get_fulfillment_by_order_id_with_lock(db, order_id)
    if not fulfillment:
        raise ValueError("Fulfillment not found for this order")

    if order.seller_id != seller_id:
        raise ValueError("Only seller can mark shipping")

    if fulfillment.status != FulfillmentStatus.PREPARING:
        raise ValueError(f"Cannot mark shipping in {fulfillment.status} state")

    fulfillment.status = FulfillmentStatus.IN_DELIVERY
    fulfillment.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.IN_DELIVERY)

    db.add(
        FulfillmentEvent(
            fulfillment_id=fulfillment.id,
            actor_id=seller_id,
            event_type=FulfillmentEventType.SELLER_MARK_SHIPPING,
            note=note or "Seller marked order as shipping",
            data={"order_id": str(order.id)},
        )
    )

    await db.commit()
    await db.refresh(fulfillment)
    return fulfillment


async def seller_mark_delivered(
    db: AsyncSession,
    order_id: uuid.UUID,
    seller_id: uuid.UUID,
    proof_image_urls: list[str],
    note: str | None = None,
) -> Fulfillment:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    fulfillment = await get_fulfillment_by_order_id_with_lock(db, order_id)
    if not fulfillment:
        raise ValueError("Fulfillment not found for this order")

    if order.seller_id != seller_id:
        raise ValueError("Only seller can mark delivered")

    if fulfillment.status != FulfillmentStatus.IN_DELIVERY:
        raise ValueError(f"Cannot mark delivered in {fulfillment.status} state")

    if not proof_image_urls:
        raise ValueError("Seller delivery proof images are required")

    fulfillment.status = FulfillmentStatus.DELIVERED_BY_SELLER
    fulfillment.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.DELIVERED)

    db.add(
        FulfillmentEvent(
            fulfillment_id=fulfillment.id,
            actor_id=seller_id,
            event_type=FulfillmentEventType.SELLER_MARK_DELIVERED,
            note=note or "Seller marked order as delivered",
            data={"order_id": str(order.id), "proof_image_urls": proof_image_urls},
        )
    )

    escrow = await crud_escrow.get_escrow_by_order_id_with_lock(db, order_id)
    if escrow:
        if escrow.status != EscrowStatus.HELD:
            raise ValueError(f"Cannot request release in {escrow.status} state")

        escrow.status = EscrowStatus.RELEASE_PENDING
        escrow.updated_at = _utc_now_naive()

        db.add(
            EscrowEvent(
                escrow_id=escrow.id,
                actor_id=seller_id,
                event_type=EscrowEventType.SELLER_MARK_DELIVERED,
                note="Seller marked order as delivered",
                data={"order_id": str(order.id), "proof_image_urls": proof_image_urls},
            )
        )

    await db.commit()
    await db.refresh(fulfillment)
    return fulfillment


async def buyer_confirm_received(
    db: AsyncSession,
    order_id: uuid.UUID,
    buyer_id: uuid.UUID,
    proof_image_urls: list[str],
    note: str | None = None,
) -> Fulfillment:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    fulfillment = await get_fulfillment_by_order_id_with_lock(db, order_id)
    if not fulfillment:
        raise ValueError("Fulfillment not found for this order")

    if order.buyer_id != buyer_id:
        raise ValueError("Only buyer can confirm received")

    if fulfillment.status != FulfillmentStatus.DELIVERED_BY_SELLER:
        raise ValueError(f"Cannot confirm receipt in {fulfillment.status} state")

    if not proof_image_urls:
        raise ValueError("Buyer receipt proof images are required")

    fulfillment.status = FulfillmentStatus.BUYER_CONFIRMED_RECEIVED
    fulfillment.updated_at = _utc_now_naive()

    db.add(
        FulfillmentEvent(
            fulfillment_id=fulfillment.id,
            actor_id=buyer_id,
            event_type=FulfillmentEventType.BUYER_CONFIRM_RECEIVED,
            note=note or "Buyer confirmed receipt",
            data={"order_id": str(order.id), "proof_image_urls": proof_image_urls},
        )
    )

    escrow = await crud_escrow.get_escrow_by_order_id_with_lock(db, order_id)
    if escrow:
        if escrow.status != EscrowStatus.RELEASE_PENDING:
            raise ValueError(f"Cannot confirm release in {escrow.status} state")

        await crud_escrow.confirm_release(db, order_id, buyer_id)
    else:
        await crud_order.complete_order(db, order)

    await db.refresh(fulfillment)
    return fulfillment
