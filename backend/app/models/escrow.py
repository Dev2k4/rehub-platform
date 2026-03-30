import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel

from app.models.enums import EscrowEventType, EscrowStatus


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Escrow(SQLModel, table=True):
    __tablename__ = "escrows"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", ondelete="CASCADE", unique=True, index=True)
    buyer_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    seller_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    status: EscrowStatus = Field(default=EscrowStatus.AWAITING_FUNDING, max_length=50)
    funded_at: datetime | None = Field(default=None)
    released_at: datetime | None = Field(default=None)
    refunded_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)


class EscrowEvent(SQLModel, table=True):
    __tablename__ = "escrow_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    escrow_id: uuid.UUID = Field(foreign_key="escrows.id", ondelete="CASCADE", index=True)
    actor_id: uuid.UUID | None = Field(default=None, foreign_key="users.id", ondelete="SET NULL", index=True)
    event_type: EscrowEventType = Field(max_length=50)
    note: str | None = Field(default=None, max_length=500)
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=_utc_now)
