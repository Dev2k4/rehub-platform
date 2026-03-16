from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.api.dependencies import get_db, get_current_admin
from app.crud.crud_user import get_users_list, update_user_status, get_user_by_id
from app.schemas.user import UserMe, UserStatusUpdate
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserMe])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin only: List all users."""
    users = await get_users_list(db, skip=skip, limit=limit)
    return users


@router.patch("/users/{user_id}/status", response_model=UserMe)
async def update_user_account_status(
    user_id: uuid.UUID,
    status_data: UserStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin only: Ban or unban a user by toggling is_active."""
    # Prevent admin from banning themselves
    if str(user_id) == str(admin_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own status."
        )

    user = await get_user_by_id(db, str(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await update_user_status(db, str(user_id), status_data.is_active)
    return updated_user

