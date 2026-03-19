from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_db, get_current_user
from app.schemas.auth import RegisterRequest, TokenResponse, RefreshRequest, VerifyEmailRequest
from app.crud.crud_user import (
    get_user_by_email,
    create_user,
    update_refresh_token,
    get_user_by_refresh_token,
    mark_user_email_verified,
)
from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    create_email_verification_token,
    decode_email_verification_token,
)
from app.models.user import User
from app.services.email_service import send_verify_email, send_welcome_email

router = APIRouter(prefix="/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)


def _role_claim(role: object) -> str:
    return role.value if hasattr(role, "value") else str(role)

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    # Check if email exists
    existing_user = await get_user_by_email(db, data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Create user
    user = await create_user(db, data)

    # Generate tokens
    access_token = create_access_token(subject=str(user.id), role=_role_claim(user.role))
    refresh_token = create_refresh_token()

    # Save hashed refresh token
    await update_refresh_token(db, user.id, hash_token(refresh_token))

    verification_token = create_email_verification_token(user.email)
    await send_verify_email(
        to_email=user.email,
        full_name=user.full_name,
        verification_token=verification_token,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login(
    request: Request,
    data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password. Uses OAuth2 form (username field = email)."""
    # Authenticate
    user = await get_user_by_email(db, data.username)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before logging in.",
        )

    # Generate tokens
    access_token = create_access_token(subject=str(user.id), role=_role_claim(user.role))
    refresh_token = create_refresh_token()

    # Update refresh token in DB
    await update_refresh_token(db, user.id, hash_token(refresh_token))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user
    )


@router.post("/refresh-token", response_model=TokenResponse)
@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using a valid refresh token. Implements token rotation."""
    hashed_rt = hash_token(data.refresh_token)

    # Find user by refresh token
    user = await get_user_by_refresh_token(db, hashed_rt)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Rotate: generate new tokens, revoke old
    new_access_token = create_access_token(subject=str(user.id), role=_role_claim(user.role))
    new_refresh_token = create_refresh_token()

    await update_refresh_token(db, user.id, hash_token(new_refresh_token))

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=user
    )


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """Verify user email using signed verification token."""
    email = decode_email_verification_token(data.token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = await mark_user_email_verified(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await send_welcome_email(to_email=user.email, full_name=user.full_name)

    return {"message": "Email verified successfully"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Logout: revoke the current refresh token."""
    await update_refresh_token(db, current_user.id, None)
    return None
