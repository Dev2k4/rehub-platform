import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import EscrowEventType, EscrowStatus


class EscrowRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    amount: Decimal
    status: EscrowStatus
    funded_at: datetime | None
    released_at: datetime | None
    refunded_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EscrowDisputeRequest(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class EscrowAdminResolveRequest(BaseModel):
    result: str = Field(pattern="^(release|refund)$")
    note: str | None = Field(default=None, max_length=500)


class EscrowEventRead(BaseModel):
    id: uuid.UUID
    escrow_id: uuid.UUID
    actor_id: uuid.UUID | None
    event_type: EscrowEventType
    note: str | None
    data: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}
