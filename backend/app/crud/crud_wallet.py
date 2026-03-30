import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.enums import WalletTransactionDirection, WalletTransactionType
from app.models.wallet import WalletAccount, WalletTransaction


def _utc_now_naive() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def get_wallet_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> WalletAccount | None:
    result = await db.execute(select(WalletAccount).where(WalletAccount.user_id == user_id))
    return result.scalar_one_or_none()


async def get_or_create_wallet(db: AsyncSession, user_id: uuid.UUID) -> WalletAccount:
    wallet = await get_wallet_by_user_id(db, user_id)
    if wallet:
        return wallet

    wallet = WalletAccount(user_id=user_id)
    db.add(wallet)
    await db.commit()
    await db.refresh(wallet)
    return wallet


async def get_wallet_with_lock(db: AsyncSession, user_id: uuid.UUID) -> WalletAccount:
    result = await db.execute(
        select(WalletAccount)
        .where(WalletAccount.user_id == user_id)
        .with_for_update()
    )
    wallet = result.scalar_one_or_none()
    if wallet:
        return wallet

    wallet = WalletAccount(user_id=user_id)
    db.add(wallet)
    await db.flush()
    result = await db.execute(
        select(WalletAccount)
        .where(WalletAccount.user_id == user_id)
        .with_for_update()
    )
    return result.scalar_one()


async def topup_demo(db: AsyncSession, user_id: uuid.UUID, amount: Decimal) -> WalletAccount:
    if amount <= Decimal("0"):
        raise ValueError("Topup amount must be greater than 0")

    wallet = await get_wallet_with_lock(db, user_id)
    wallet.available_balance += amount
    wallet.updated_at = _utc_now_naive()

    tx = WalletTransaction(
        user_id=user_id,
        type=WalletTransactionType.TOPUP_DEMO,
        direction=WalletTransactionDirection.CREDIT,
        amount=amount,
        balance_after=wallet.available_balance,
        metadata_json={"source": "demo_topup"},
    )
    db.add(tx)
    await db.commit()
    await db.refresh(wallet)
    return wallet


async def create_wallet_transaction(
    db: AsyncSession,
    user_id: uuid.UUID,
    tx_type: WalletTransactionType,
    direction: WalletTransactionDirection,
    amount: Decimal,
    balance_after: Decimal,
    order_id: uuid.UUID | None = None,
    metadata: dict | None = None,
) -> WalletTransaction:
    tx = WalletTransaction(
        user_id=user_id,
        order_id=order_id,
        type=tx_type,
        direction=direction,
        amount=amount,
        balance_after=balance_after,
        metadata_json=metadata or {},
    )
    db.add(tx)
    await db.flush()
    return tx


async def list_wallet_transactions(db: AsyncSession, user_id: uuid.UUID, limit: int = 50) -> list[WalletTransaction]:
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == user_id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
