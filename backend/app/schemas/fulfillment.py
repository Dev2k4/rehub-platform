import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import FulfillmentStatus


class FulfillmentRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    status: FulfillmentStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FulfillmentMarkDeliveredRequest(BaseModel):
    proof_image_urls: list[str] = Field(default_factory=list, min_length=1)
    note: str | None = Field(default=None, max_length=500)


class FulfillmentMarkShippingRequest(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class FulfillmentBuyerConfirmRequest(BaseModel):
    proof_image_urls: list[str] = Field(default_factory=list, min_length=1)
    note: str | None = Field(default=None, max_length=500)
