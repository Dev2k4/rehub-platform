import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Review(SQLModel, table=True):
    __tablename__ = "reviews"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", ondelete="CASCADE")
    reviewer_id: uuid.UUID = Field(foreign_key="users.id")
    reviewee_id: uuid.UUID = Field(foreign_key="users.id")
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

    created_at: datetime = Field(default_factory=_utc_now)
