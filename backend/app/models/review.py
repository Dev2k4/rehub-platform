import uuid
from typing import Optional
from sqlmodel import Field, SQLModel, UniqueConstraint
from datetime import datetime, timezone

class Review(SQLModel, table=True):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("order_id", "reviewer_id", name="uq_review_order_reviewer"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", ondelete="CASCADE")
    reviewer_id: uuid.UUID = Field(foreign_key="users.id")
    reviewee_id: uuid.UUID = Field(foreign_key="users.id")
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
