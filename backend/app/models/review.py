import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone

class Review(SQLModel, table=True):
    __tablename__ = "reviews"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", unique=True)
    reviewer_id: uuid.UUID = Field(foreign_key="users.id")
    reviewee_id: uuid.UUID = Field(foreign_key="users.id")
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
