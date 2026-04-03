import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class ChatConversationRead(BaseModel):
    id: uuid.UUID
    participant_a_id: uuid.UUID
    participant_b_id: uuid.UUID
    unread_count: int = 0
    last_message_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageSendRequest(BaseModel):
    message_type: Literal["text", "listing_share"] = "text"
    content: str | None = Field(default=None, max_length=4000)
    listing_id: uuid.UUID | None = None


class ChatListingPreview(BaseModel):
    id: uuid.UUID
    title: str
    price: Decimal
    image_url: str | None = None


class ChatMessageRead(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    message_type: Literal["text", "listing_share"] = "text"
    content: str | None = None
    listing: ChatListingPreview | None = None
    created_at: datetime


class ChatMessageHistoryRead(BaseModel):
    items: list[ChatMessageRead]
    total: int
    page: int
    size: int


class ChatMarkReadResponse(BaseModel):
    ok: bool = True
