import uuid
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, condecimal
from app.models.enums import ConditionGrade, ListingStatus

class ListingBase(BaseModel):
    title: str = Field(..., max_length=500, min_length=5)
    description: Optional[str] = None
    price: condecimal(max_digits=12, decimal_places=2) # type: ignore
    is_negotiable: bool = True
    condition_grade: ConditionGrade
    category_id: uuid.UUID

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500, min_length=5)
    description: Optional[str] = None
    price: Optional[condecimal(max_digits=12, decimal_places=2)] = None # type: ignore
    is_negotiable: Optional[bool] = None
    condition_grade: Optional[ConditionGrade] = None
    category_id: Optional[uuid.UUID] = None
    status: Optional[ListingStatus] = None  # Seller can hide, Admin can accept/reject

class ListingRead(ListingBase):
    id: uuid.UUID
    seller_id: uuid.UUID
    status: ListingStatus
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

class ListingImageRead(BaseModel):
    id: uuid.UUID
    image_url: str
    thumbnail_url: Optional[str] = None
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class ListingWithImages(ListingRead):
    images: List[ListingImageRead] = []

class ListingPaginated(BaseModel):
    items: List[ListingWithImages]
    total: int
    page: int
    size: int

