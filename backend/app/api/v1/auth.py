from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from typing import Annotated
import uuid

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_db, get_current_user
from app.core.cache import cache
from app.core.rate_limit import RateLimitError, enforce_rate_limit
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    RefreshRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SendPhoneOtpRequest,
    VerifyPhoneOtpRequest,
    PhoneOtpResponse,
)
from app.crud.crud_user import (
    get_user_by_email,
    create_user,
    update_refresh_token,
    get_user_by_refresh_token,
    mark_user_email_verified,
    update_user_password_by_email,
)
from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    create_email_verification_token,
    decode_email_verification_token,
    create_password_reset_token,
    decode_password_reset_token,
)
from app.models.user import User
from app.services.email_service import send_verify_email, send_welcome_email, send_password_reset_email
from app.services.sms_service import generate_otp_code, send_phone_otp

router = APIRouter(prefix="/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)
_phone_otp_memory: dict[str, dict[str, str]] = {}
_verified_phone_memory: set[str] = set()


def _role_claim(role: object) -> str:
    return role.value if hasattr(role, "value") else str(role)


def _phone_otp_key(user_id: uuid.UUID) -> str:
    return f"phone-otp:{user_id}"


def _phone_verified_key(user_id: uuid.UUID) -> str:
    return f"phone-verified:{user_id}"


async def _store_phone_otp(user_id: uuid.UUID, payload: dict[str, str]) -> None:
    if cache.is_connected:
        await cache.set_json(_phone_otp_key(user_id), payload, ttl=10 * 60)
        return
    _phone_otp_memory[str(user_id)] = payload


async def _load_phone_otp(user_id: uuid.UUID) -> dict[str, str] | None:
    if cache.is_connected:
        return await cache.get_json(_phone_otp_key(user_id))
    return _phone_otp_memory.get(str(user_id))


async def _mark_phone_verified(user_id: uuid.UUID) -> None:
    if cache.is_connected:
        await cache.set(_phone_verified_key(user_id), "1", ttl=24 * 60 * 60)
        return
    _verified_phone_memory.add(str(user_id))


async def _is_phone_verified_marked(user_id: uuid.UUID) -> bool:
    if cache.is_connected:
        return bool(await cache.get(_phone_verified_key(user_id)))
    return str(user_id) in _verified_phone_memory

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    # Check if email exists
    existing_user = await get_user_by_email(db, data.email)
    if existing_user:
        if not existing_user.is_email_verified:
            verification_token = create_email_verification_token(existing_user.email)
            await send_verify_email(
                to_email=existing_user.email,
                full_name=existing_user.full_name,
                verification_token=verification_token,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered but not verified. Verification email was resent.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Create user
    user = await create_user(db, data)

    verification_token = create_email_verification_token(user.email)
    await send_verify_email(
        to_email=user.email,
        full_name=user.full_name,
        verification_token=verification_token,
    )

    return RegisterResponse(
        message="Register successful. Please verify your email before logging in.",
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes", exempt_when=lambda: settings.TESTING)
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

    if (
        settings.REQUIRE_EMAIL_VERIFICATION
        and not settings.TESTING
        and not user.is_email_verified
    ):
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


@router.post("/send-phone-otp", response_model=PhoneOtpResponse)
async def send_phone_otp_route(
    data: SendPhoneOtpRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    try:
        await enforce_rate_limit("phone-otp:send", str(current_user.id), limit=3, window_seconds=300)
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail=exc.message)

    phone = (data.phone or current_user.phone or "").strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    otp_code = generate_otp_code()
    await _store_phone_otp(current_user.id, {"phone": phone, "otp_code": otp_code})
    send_phone_otp(phone, otp_code)

    debug_otp = otp_code if settings.SMS_DEBUG_MODE else None
    return PhoneOtpResponse(message="OTP da duoc gui toi so dien thoai cua ban", debug_otp=debug_otp)


@router.post("/verify-phone-otp", response_model=PhoneOtpResponse)
async def verify_phone_otp_route(
    data: VerifyPhoneOtpRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    try:
        await enforce_rate_limit("phone-otp:verify", str(current_user.id), limit=8, window_seconds=300)
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail=exc.message)

    pending = await _load_phone_otp(current_user.id)
    if not pending:
        raise HTTPException(status_code=404, detail="OTP expired or not found")

    if pending.get("otp_code") != data.otp_code.strip():
        raise HTTPException(status_code=400, detail="OTP khong hop le")

    if current_user.phone and pending.get("phone") != current_user.phone:
        raise HTTPException(status_code=400, detail="Phone number has changed. Please resend OTP.")

    await db.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(is_phone_verified=True)
    )
    await db.commit()
    await _mark_phone_verified(current_user.id)
    if cache.is_connected:
        await cache.delete(_phone_otp_key(current_user.id))
    else:
        _phone_otp_memory.pop(str(current_user.id), None)

    return PhoneOtpResponse(message="So dien thoai da duoc xac thuc")


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


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification_email(data: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Resend verification email for an unverified account."""
    user = await get_user_by_email(db, data.email)
    if not user:
        return {"message": "If this email exists, a verification email has been sent"}

    if user.is_email_verified:
        return {"message": "Email is already verified"}

    verification_token = create_email_verification_token(user.email)
    await send_verify_email(
        to_email=user.email,
        full_name=user.full_name,
        verification_token=verification_token,
    )

    return {"message": "Verification email sent"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send password reset email if the account exists."""
    user = await get_user_by_email(db, data.email)
    if not user:
        return {"message": "If this email exists, a password reset email has been sent"}

    reset_token = create_password_reset_token(user.email)
    await send_password_reset_email(
        to_email=user.email,
        full_name=user.full_name,
        reset_token=reset_token,
    )

    return {"message": "If this email exists, a password reset email has been sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using signed reset token."""
    email = decode_password_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = await update_user_password_by_email(db, email, data.new_password)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": "Password reset successfully"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Logout: revoke the current refresh token."""
    await update_refresh_token(db, current_user.id, None)
    return None
