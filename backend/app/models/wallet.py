import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel

from app.models.enums import WalletTransactionDirection, WalletTransactionType


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class WalletAccount(SQLModel, table=True):
    __tablename__ = "wallet_accounts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", unique=True, index=True)
    available_balance: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    locked_balance: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)


class WalletTransaction(SQLModel, table=True):
    __tablename__ = "wallet_transactions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    order_id: uuid.UUID | None = Field(default=None, foreign_key="orders.id", ondelete="SET NULL", index=True)
    type: WalletTransactionType = Field(max_length=50)
    direction: WalletTransactionDirection = Field(max_length=20)
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    balance_after: Decimal = Field(max_digits=12, decimal_places=2)
    metadata_json: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column("metadata", JSON),
    )
    created_at: datetime = Field(default_factory=_utc_now)
