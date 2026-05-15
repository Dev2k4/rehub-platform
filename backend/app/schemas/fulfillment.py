import uuid
from datetime import datetime
from typing import Any


from pydantic import BaseModel, Field, model_validator

from app.models.enums import FulfillmentStatus


class FulfillmentRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    status: FulfillmentStatus
    seller_proof_image_urls: list[str] = []
    buyer_proof_image_urls: list[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def _normalize_proof_image_urls(cls, data: Any) -> Any:
        # If it's an ORM model
        if hasattr(data, "seller_proof_image_urls"):
            if data.seller_proof_image_urls is None:
                data.seller_proof_image_urls = []
            if data.buyer_proof_image_urls is None:
                data.buyer_proof_image_urls = []
        # If it's a dict
        elif isinstance(data, dict):
            if data.get("seller_proof_image_urls") is None:
                data["seller_proof_image_urls"] = []
            if data.get("buyer_proof_image_urls") is None:
                data["buyer_proof_image_urls"] = []
        return data


class FulfillmentMarkDeliveredRequest(BaseModel):
    proof_image_urls: list[str] = Field(default_factory=list, min_length=1)
    note: str | None = Field(default=None, max_length=500)


class FulfillmentMarkShippingRequest(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class FulfillmentBuyerConfirmRequest(BaseModel):
    proof_image_urls: list[str] = Field(default_factory=list, min_length=1)
    note: str | None = Field(default=None, max_length=500)
