import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.crud import crud_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationRead])
async def get_my_notifications(
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	return await crud_notification.get_user_notifications(db, current_user.id)


@router.get("/unread-count")
async def get_unread_notifications_count(
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	unread_count = await crud_notification.get_unread_count(db, current_user.id)
	return {"unread_count": unread_count}


@router.put("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_as_read(
	notification_id: uuid.UUID,
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	notification = await crud_notification.mark_notification_as_read(
		db,
		notification_id,
		current_user.id,
	)
	if not notification:
		raise HTTPException(status_code=404, detail="Notification not found")
	return notification


@router.put("/read-all")
async def mark_all_notifications_as_read(
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	updated_count = await crud_notification.mark_all_notifications_as_read(db, current_user.id)
	return {"updated_count": updated_count}
