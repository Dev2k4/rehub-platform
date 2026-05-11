import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import WalletTransactionDirection, WalletTransactionType


class WalletAccountRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    available_balance: Decimal
    locked_balance: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WalletTransactionRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    order_id: uuid.UUID | None
    type: WalletTransactionType
    direction: WalletTransactionDirection
    amount: Decimal
    balance_after: Decimal
    metadata: dict[str, Any] = Field(validation_alias="metadata_json")
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletDemoTopupRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
