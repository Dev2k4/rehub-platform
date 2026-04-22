import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import FulfillmentStatus, OrderStatus


class OrderBase(BaseModel):
	final_price: Decimal = Field(..., gt=0, decimal_places=2)


class OrderCreate(OrderBase):
	buyer_id: uuid.UUID
	seller_id: uuid.UUID
	listing_id: uuid.UUID


class OrderDirectCreate(BaseModel):
	listing_id: uuid.UUID
	use_escrow: bool = False


class OrderRead(OrderBase):
	id: uuid.UUID
	buyer_id: uuid.UUID
	seller_id: uuid.UUID
	listing_id: uuid.UUID
	status: OrderStatus
	fulfillment_status: FulfillmentStatus
	seller_marked_delivered_at: datetime | None
	buyer_confirmed_received_at: datetime | None
	created_at: datetime
	updated_at: datetime

	model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
	status: OrderStatus
