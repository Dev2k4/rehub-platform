import uuid
from decimal import Decimal
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from datetime import datetime, timezone
from app.models.enums import OrderStatus

class Order(SQLModel, table=True):
    __tablename__ = "orders"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    buyer_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    seller_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    listing_id: uuid.UUID = Field(foreign_key="listings.id", ondelete="CASCADE")
    final_price: Decimal = Field(decimal_places=2, max_digits=12)
    status: OrderStatus = Field(default=OrderStatus.PENDING, sa_column=Column(String(50)))
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
