import uuid
from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
	user_id: uuid.UUID
	type: str = Field(..., max_length=50)
	title: str = Field(..., max_length=255)
	message: str
	data: Optional[dict[str, Any]] = None


class NotificationRead(NotificationCreate):
	id: uuid.UUID
	is_read: bool
	created_at: datetime

	model_config = {"from_attributes": True}
