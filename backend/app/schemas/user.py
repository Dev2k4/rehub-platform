from typing import Optional
from pydantic import BaseModel, EmailStr, Field
import uuid
from datetime import datetime


class UserUpdate(BaseModel):
    """Schema for updating user profile info (PUT /users/me)."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    province: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    ward: Optional[str] = Field(None, max_length=100)
    address_detail: Optional[str] = Field(None, max_length=255)

class UserStatusUpdate(BaseModel):
    """Schema for updating user active status by Admin."""
    is_active: bool

class UserMe(BaseModel):
    """Full user info returned to the authenticated user (GET /users/me)."""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    address_detail: Optional[str] = None
    is_phone_verified: bool
    is_email_verified: bool
    trust_score: float
    rating_avg: float
    rating_count: int
    completed_orders: int
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
    province: Optional[str] = None
    trust_score: float
    rating_avg: float
    rating_count: int
    completed_orders: int
    created_at: datetime

    model_config = {"from_attributes": True}
