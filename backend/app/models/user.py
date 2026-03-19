import uuid
from decimal import Decimal
from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from datetime import datetime
from app.models.enums import UserRole

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    phone: Optional[str] = Field(max_length=20, default=None)
    password_hash: str = Field(max_length=255)
    full_name: str = Field(max_length=255)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    
    # Address info
    province: Optional[str] = Field(max_length=100, default=None)
    district: Optional[str] = Field(max_length=100, default=None)
    ward: Optional[str] = Field(max_length=100, default=None)
    address_detail: Optional[str] = Field(max_length=255, default=None)
    
    # Verification & Stats
    is_phone_verified: bool = Field(default=False)
    is_email_verified: bool = Field(default=False)
    trust_score: Decimal = Field(default=Decimal("0.0"), max_digits=5, decimal_places=1)
    rating_avg: Decimal = Field(default=Decimal("0.00"), max_digits=3, decimal_places=2)
    rating_count: int = Field(default=0)
    completed_orders: int = Field(default=0)
    
    # System
    role: UserRole = Field(default=UserRole.USER, sa_column=Column(String(50)))
    is_active: bool = Field(default=True)
    hashed_refresh_token: Optional[str] = Field(max_length=255, default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
