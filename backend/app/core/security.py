import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt
from hashlib import sha256
from pwdlib import PasswordHash
from app.core.config import settings

password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(plain_password, hashed_password)

def create_access_token(subject: str | Any, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> str:
    # Generate 32 bytes random string
    return secrets.token_hex(32)

def hash_token(token: str) -> str:
    # Hash refresh token before saving to DB
    return sha256(token.encode("utf-8")).hexdigest()

def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
