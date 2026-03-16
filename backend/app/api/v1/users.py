from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
import uuid

from app.api.dependencies import get_db, get_current_user
from app.schemas.user import UserUpdate, UserMe, UserPublicProfile
from app.crud.crud_user import update_user, get_user_by_id
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserMe)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get the authenticated user's full profile."""
    return current_user


@router.put("/me", response_model=UserMe)
async def update_my_profile(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update the authenticated user's profile info."""
    updated_user = await update_user(db, user_id=current_user.id, data=data)
    return updated_user


@router.get("/{user_id}/profile", response_model=UserPublicProfile)
async def get_user_public_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public profile (visible to anyone)."""
    user = await get_user_by_id(db, user_id=str(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
