import uuid
from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud import crud_order, crud_wallet
from app.models.enums import (
    EscrowEventType,
    EscrowStatus,
    OrderStatus,
    WalletTransactionDirection,
    WalletTransactionType,
)
from app.models.escrow import Escrow, EscrowEvent
from app.models.order import Order
from app.models.user import User


def _utc_now_naive() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def get_escrow_by_order_id(db: AsyncSession, order_id: uuid.UUID) -> Escrow | None:
    result = await db.execute(select(Escrow).where(Escrow.order_id == order_id))
    return result.scalar_one_or_none()


async def list_disputed_escrows(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Escrow]:
    result = await db.execute(
        select(Escrow)
        .where(Escrow.status == EscrowStatus.DISPUTED)
        .order_by(Escrow.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_escrow_by_order_id_with_lock(db: AsyncSession, order_id: uuid.UUID) -> Escrow | None:
    result = await db.execute(
        select(Escrow)
        .where(Escrow.order_id == order_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def create_escrow_for_order(db: AsyncSession, order: Order) -> Escrow:
    existing = await get_escrow_by_order_id(db, order.id)
    if existing:
        return existing

    escrow = Escrow(
        order_id=order.id,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        amount=order.final_price,
        status=EscrowStatus.AWAITING_FUNDING,
    )
    db.add(escrow)
    await db.flush()

    event = EscrowEvent(
        escrow_id=escrow.id,
        actor_id=order.buyer_id,
        event_type=EscrowEventType.CREATED,
        note="Escrow created for order",
        data={"order_id": str(order.id)},
    )
    db.add(event)
    await db.commit()
    await db.refresh(escrow)
    return escrow


async def fund_escrow(db: AsyncSession, order: Order, buyer_id: uuid.UUID) -> Escrow:
    escrow = await get_escrow_by_order_id_with_lock(db, order.id)
    if not escrow:
        raise ValueError("Escrow not found for this order")

    if escrow.buyer_id != buyer_id:
        raise ValueError("Only buyer can fund escrow")

    if escrow.status != EscrowStatus.AWAITING_FUNDING:
        raise ValueError(f"Cannot fund escrow in {escrow.status} state")

    wallet = await crud_wallet.get_wallet_with_lock(db, buyer_id)
    if wallet.available_balance < escrow.amount:
        raise ValueError("Insufficient demo wallet balance to fund escrow")

    wallet.available_balance -= escrow.amount
    wallet.locked_balance += escrow.amount
    wallet.updated_at = _utc_now_naive()

    await crud_wallet.create_wallet_transaction(
        db=db,
        user_id=buyer_id,
        tx_type=WalletTransactionType.HOLD,
        direction=WalletTransactionDirection.DEBIT,
        amount=escrow.amount,
        balance_after=wallet.available_balance,
        order_id=order.id,
        metadata={"escrow_id": str(escrow.id), "action": "fund_escrow"},
    )

    escrow.status = EscrowStatus.HELD
    escrow.funded_at = _utc_now_naive()
    escrow.updated_at = _utc_now_naive()

    event = EscrowEvent(
        escrow_id=escrow.id,
        actor_id=buyer_id,
        event_type=EscrowEventType.FUNDED,
        note="Buyer funded escrow",
        data={"order_id": str(order.id), "amount": str(escrow.amount)},
    )
    db.add(event)

    await db.commit()
    await db.refresh(escrow)
    return escrow


async def request_release(db: AsyncSession, order_id: uuid.UUID, seller_id: uuid.UUID) -> Escrow:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    escrow = await get_escrow_by_order_id_with_lock(db, order_id)
    if not escrow:
        raise ValueError("Escrow not found for this order")

    if order.seller_id != seller_id:
        raise ValueError("Only seller can request release")

    if escrow.status != EscrowStatus.HELD:
        raise ValueError(f"Cannot request release in {escrow.status} state")

    escrow.status = EscrowStatus.RELEASE_PENDING
    escrow.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.DELIVERED)

    db.add(EscrowEvent(
        escrow_id=escrow.id,
        actor_id=seller_id,
        event_type=EscrowEventType.SELLER_MARK_DELIVERED,
        note="Seller marked order as delivered",
        data={"order_id": str(order.id)},
    ))

    await db.commit()
    await db.refresh(escrow)
    return escrow


async def confirm_release(db: AsyncSession, order_id: uuid.UUID, buyer_id: uuid.UUID) -> Escrow:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    escrow = await get_escrow_by_order_id_with_lock(db, order_id)
    if not escrow:
        raise ValueError("Escrow not found for this order")

    if order.buyer_id != buyer_id:
        raise ValueError("Only buyer can confirm release")

    if escrow.status != EscrowStatus.RELEASE_PENDING:
        raise ValueError(f"Cannot confirm release in {escrow.status} state")

    buyer_wallet = await crud_wallet.get_wallet_with_lock(db, buyer_id)
    seller_wallet = await crud_wallet.get_wallet_with_lock(db, order.seller_id)

    if buyer_wallet.locked_balance < escrow.amount:
        raise ValueError("Buyer locked balance is insufficient")

    buyer_wallet.locked_balance -= escrow.amount
    buyer_wallet.updated_at = _utc_now_naive()

    seller_wallet.available_balance += escrow.amount
    seller_wallet.updated_at = _utc_now_naive()

    await crud_wallet.create_wallet_transaction(
        db=db,
        user_id=buyer_id,
        tx_type=WalletTransactionType.RELEASE,
        direction=WalletTransactionDirection.DEBIT,
        amount=escrow.amount,
        balance_after=buyer_wallet.available_balance,
        order_id=order.id,
        metadata={"escrow_id": str(escrow.id), "action": "release_from_locked"},
    )
    await crud_wallet.create_wallet_transaction(
        db=db,
        user_id=order.seller_id,
        tx_type=WalletTransactionType.RELEASE,
        direction=WalletTransactionDirection.CREDIT,
        amount=escrow.amount,
        balance_after=seller_wallet.available_balance,
        order_id=order.id,
        metadata={"escrow_id": str(escrow.id), "action": "release_to_seller"},
    )

    escrow.status = EscrowStatus.RELEASED
    escrow.released_at = _utc_now_naive()
    escrow.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.COMPLETED)

    await db.execute(
        update(User)
        .where(User.id == order.seller_id)
        .values(completed_orders=User.completed_orders + 1)
    )

    db.add(EscrowEvent(
        escrow_id=escrow.id,
        actor_id=buyer_id,
        event_type=EscrowEventType.BUYER_CONFIRM,
        note="Buyer confirmed delivery and released escrow",
        data={"order_id": str(order.id), "amount": str(escrow.amount)},
    ))

    await db.commit()
    await db.refresh(escrow)
    return escrow


async def open_dispute(db: AsyncSession, order_id: uuid.UUID, actor_id: uuid.UUID, note: str | None = None) -> Escrow:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    if actor_id != order.buyer_id and actor_id != order.seller_id:
        raise ValueError("Not authorized to dispute this order")

    escrow = await get_escrow_by_order_id_with_lock(db, order_id)
    if not escrow:
        raise ValueError("Escrow not found for this order")

    if escrow.status != EscrowStatus.RELEASE_PENDING:
        raise ValueError(f"Cannot open dispute in {escrow.status} state")

    from app.crud import crud_fulfillment
    from app.models.enums import FulfillmentStatus

    fulfillment = await crud_fulfillment.get_fulfillment_by_order_id_with_lock(db, order_id)
    if not fulfillment:
        raise ValueError("Fulfillment not found for this order")

    if fulfillment.status != FulfillmentStatus.DELIVERED_BY_SELLER:
        raise ValueError("Dispute is only available after seller marks delivered")

    escrow.status = EscrowStatus.DISPUTED
    escrow.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.DISPUTED)

    db.add(EscrowEvent(
        escrow_id=escrow.id,
        actor_id=actor_id,
        event_type=EscrowEventType.DISPUTE_OPENED,
        note=note or "Dispute opened",
        data={"order_id": str(order.id)},
    ))

    await db.commit()
    await db.refresh(escrow)
    return escrow


async def admin_resolve_release(db: AsyncSession, order_id: uuid.UUID, admin_id: uuid.UUID, note: str | None = None) -> Escrow:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    escrow = await get_escrow_by_order_id_with_lock(db, order_id)
    if not escrow:
        raise ValueError("Escrow not found for this order")

    if escrow.status not in {EscrowStatus.DISPUTED, EscrowStatus.RELEASE_PENDING}:
        raise ValueError(f"Cannot resolve release in {escrow.status} state")

    buyer_wallet = await crud_wallet.get_wallet_with_lock(db, order.buyer_id)
    seller_wallet = await crud_wallet.get_wallet_with_lock(db, order.seller_id)

    if buyer_wallet.locked_balance < escrow.amount:
        raise ValueError("Buyer locked balance is insufficient")

    buyer_wallet.locked_balance -= escrow.amount
    buyer_wallet.updated_at = _utc_now_naive()
    seller_wallet.available_balance += escrow.amount
    seller_wallet.updated_at = _utc_now_naive()

    await crud_wallet.create_wallet_transaction(
        db=db,
        user_id=order.buyer_id,
        tx_type=WalletTransactionType.RELEASE,
        direction=WalletTransactionDirection.DEBIT,
        amount=escrow.amount,
        balance_after=buyer_wallet.available_balance,
        order_id=order.id,
        metadata={"escrow_id": str(escrow.id), "action": "admin_release_from_locked"},
    )
    await crud_wallet.create_wallet_transaction(
        db=db,
        user_id=order.seller_id,
        tx_type=WalletTransactionType.RELEASE,
        direction=WalletTransactionDirection.CREDIT,
        amount=escrow.amount,
        balance_after=seller_wallet.available_balance,
        order_id=order.id,
        metadata={"escrow_id": str(escrow.id), "action": "admin_release_to_seller"},
    )

    escrow.status = EscrowStatus.RELEASED
    escrow.released_at = _utc_now_naive()
    escrow.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.COMPLETED)

    await db.execute(
        update(User)
        .where(User.id == order.seller_id)
        .values(completed_orders=User.completed_orders + 1)
    )

    db.add(EscrowEvent(
        escrow_id=escrow.id,
        actor_id=admin_id,
        event_type=EscrowEventType.ADMIN_RESOLVE,
        note=note or "Admin resolved dispute to release funds",
        data={"order_id": str(order.id), "result": "release"},
    ))

    await db.commit()
    await db.refresh(escrow)
    return escrow


async def admin_resolve_refund(db: AsyncSession, order_id: uuid.UUID, admin_id: uuid.UUID, note: str | None = None) -> Escrow:
    order = await crud_order.get_order_by_id_with_lock(db, order_id)
    if not order:
        raise ValueError("Order not found")

    escrow = await get_escrow_by_order_id_with_lock(db, order_id)
    if not escrow:
        raise ValueError("Escrow not found for this order")

    if escrow.status not in {EscrowStatus.DISPUTED, EscrowStatus.HELD, EscrowStatus.RELEASE_PENDING}:
        raise ValueError(f"Cannot resolve refund in {escrow.status} state")

    buyer_wallet = await crud_wallet.get_wallet_with_lock(db, order.buyer_id)
    if buyer_wallet.locked_balance < escrow.amount:
        raise ValueError("Buyer locked balance is insufficient")

    buyer_wallet.locked_balance -= escrow.amount
    buyer_wallet.available_balance += escrow.amount
    buyer_wallet.updated_at = _utc_now_naive()

    await crud_wallet.create_wallet_transaction(
        db=db,
        user_id=order.buyer_id,
        tx_type=WalletTransactionType.REFUND,
        direction=WalletTransactionDirection.CREDIT,
        amount=escrow.amount,
        balance_after=buyer_wallet.available_balance,
        order_id=order.id,
        metadata={"escrow_id": str(escrow.id), "action": "admin_refund_to_buyer"},
    )

    escrow.status = EscrowStatus.REFUNDED
    escrow.refunded_at = _utc_now_naive()
    escrow.updated_at = _utc_now_naive()
    crud_order.set_order_status(order, OrderStatus.CANCELLED)

    db.add(EscrowEvent(
        escrow_id=escrow.id,
        actor_id=admin_id,
        event_type=EscrowEventType.ADMIN_RESOLVE,
        note=note or "Admin resolved dispute to refund buyer",
        data={"order_id": str(order.id), "result": "refund"},
    ))

    await db.commit()
    await db.refresh(escrow)
    return escrow
