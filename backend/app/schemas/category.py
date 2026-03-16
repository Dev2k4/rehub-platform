from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
from datetime import datetime

class CategoryBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    parent_id: Optional[uuid.UUID] = None
    icon_url: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    parent_id: Optional[uuid.UUID] = None
    icon_url: Optional[str] = None

class CategoryRead(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    
    model_config = {"from_attributes": True}

class CategoryTree(CategoryRead):
    children: List["CategoryTree"] = []
    
CategoryTree.model_rebuild()

