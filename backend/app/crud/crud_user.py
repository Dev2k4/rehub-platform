from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_refresh_token(db: AsyncSession, hashed_token: str) -> Optional[User]:
    """Find user by their hashed refresh token."""
    result = await db.execute(
        select(User).where(User.hashed_refresh_token == hashed_token)
    )
    return result.scalar_one_or_none()

async def get_users_list(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

async def update_user_status(db: AsyncSession, user_id: str, is_active: bool) -> Optional[User]:
    from datetime import datetime, timezone
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(is_active=is_active, updated_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return await get_user_by_id(db, user_id)


async def create_user(db: AsyncSession, data: RegisterRequest) -> User:
    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        password_hash=hash_password(data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_refresh_token(db: AsyncSession, user_id: str, hashed_token: Optional[str]):
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(hashed_refresh_token=hashed_token)
    )
    await db.commit()


async def update_user(db: AsyncSession, user_id, data) -> User:
    """Partial update: only update fields that were explicitly set."""
    from datetime import datetime, timezone
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        # Nothing to update, just return current user
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one()

    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(**update_data)
    )
    await db.commit()

    # Return refreshed user
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one()
