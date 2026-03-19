import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class Category(SQLModel, table=True):
    __tablename__ = "categories"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    parent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="categories.id")
    name: str = Field(max_length=255)
    slug: str = Field(max_length=255, unique=True)
    icon_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
