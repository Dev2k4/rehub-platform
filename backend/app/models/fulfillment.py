import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel

from app.models.enums import FulfillmentEventType, FulfillmentStatus


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Fulfillment(SQLModel, table=True):
    __tablename__ = "fulfillments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", ondelete="CASCADE", unique=True, index=True)
    buyer_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    seller_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    status: FulfillmentStatus = Field(default=FulfillmentStatus.PENDING_SELLER_START, max_length=50)
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)


class FulfillmentEvent(SQLModel, table=True):
    __tablename__ = "fulfillment_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    fulfillment_id: uuid.UUID = Field(foreign_key="fulfillments.id", ondelete="CASCADE", index=True)
    actor_id: uuid.UUID | None = Field(default=None, foreign_key="users.id", ondelete="SET NULL", index=True)
    event_type: FulfillmentEventType = Field(max_length=50)
    note: str | None = Field(default=None, max_length=500)
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=_utc_now)
