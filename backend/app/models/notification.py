import uuid
from typing import Any
from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel
from datetime import datetime

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    type: str = Field(max_length=50)
    title: str = Field(max_length=255)
    message: str
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    is_read: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
