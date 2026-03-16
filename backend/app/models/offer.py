import uuid
from decimal import Decimal
from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from datetime import datetime, timezone
from app.models.enums import OfferStatus

class Offer(SQLModel, table=True):
    __tablename__ = "offers"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    listing_id: uuid.UUID = Field(foreign_key="listings.id", ondelete="CASCADE")
    buyer_id: uuid.UUID = Field(foreign_key="users.id")
    offer_price: Decimal = Field(decimal_places=2, max_digits=12)
    status: OfferStatus = Field(default=OfferStatus.PENDING, sa_column=Column(String(50)))
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
