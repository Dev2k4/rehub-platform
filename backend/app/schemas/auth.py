from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import uuid
import re
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserPublicResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    trust_score: float
    rating_avg: float
    rating_count: int
    completed_orders: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublicResponse

class RefreshRequest(BaseModel):
    refresh_token: str
