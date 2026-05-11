import uuid
from decimal import Decimal
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from datetime import datetime, timezone
from app.models.enums import OfferStatus


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Offer(SQLModel, table=True):
    __tablename__ = "offers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    listing_id: uuid.UUID = Field(foreign_key="listings.id", ondelete="CASCADE")
    buyer_id: uuid.UUID = Field(foreign_key="users.id")
    offer_price: Decimal = Field(decimal_places=2, max_digits=12)
    status: OfferStatus = Field(default=OfferStatus.PENDING, sa_column=Column(String(50)))

    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)
