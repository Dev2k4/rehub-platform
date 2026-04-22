import uuid
from decimal import Decimal
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from datetime import datetime, timezone
from app.models.enums import FulfillmentStatus, OrderStatus


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    buyer_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    seller_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    listing_id: uuid.UUID = Field(foreign_key="listings.id", ondelete="CASCADE")
    final_price: Decimal = Field(decimal_places=2, max_digits=12)
    status: OrderStatus = Field(default=OrderStatus.PENDING, sa_column=Column(String(50)))
    fulfillment_status: FulfillmentStatus = Field(
        default=FulfillmentStatus.CREATED,
        sa_column=Column(String(50), nullable=False, default=FulfillmentStatus.CREATED.value),
    )
    seller_marked_delivered_at: datetime | None = Field(default=None)
    buyer_confirmed_received_at: datetime | None = Field(default=None)

    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)
