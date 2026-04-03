import uuid
from decimal import Decimal
from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from datetime import datetime, timezone
from app.models.enums import ConditionGrade, ListingStatus


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Listing(SQLModel, table=True):
    __tablename__ = "listings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    seller_id: uuid.UUID = Field(foreign_key="users.id")
    category_id: uuid.UUID = Field(foreign_key="categories.id")
    title: str = Field(max_length=500)
    description: Optional[str] = None
    price: Decimal = Field(decimal_places=2, max_digits=12)
    is_negotiable: bool = Field(default=True)
    condition_grade: ConditionGrade = Field(sa_column=Column(String(50)))
    status: ListingStatus = Field(default=ListingStatus.PENDING, sa_column=Column(String(50)))

    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)

class ListingImage(SQLModel, table=True):
    __tablename__ = "listing_images"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    listing_id: uuid.UUID = Field(foreign_key="listings.id", ondelete="CASCADE")
    image_url: str
    thumbnail_url: Optional[str] = None
    is_primary: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utc_now)
