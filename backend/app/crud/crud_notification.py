import uuid
import logging
from sqlalchemy import func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.schemas.notification import NotificationRead
from app.services.websocket_manager import connection_manager

logger = logging.getLogger(__name__)


async def get_user_notifications(db: AsyncSession, user_id: uuid.UUID) -> list[Notification]:
	result = await db.execute(
		select(Notification)
		.where(Notification.user_id == user_id)
		.order_by(Notification.created_at.desc())
	)
	return list(result.scalars().all())


async def get_user_notifications_history(
	db: AsyncSession,
	user_id: uuid.UUID,
	read_filter: str = "all",
	type_filter: str = "all",
	skip: int = 0,
	limit: int = 20,
) -> tuple[list[Notification], int]:
	query = select(Notification).where(Notification.user_id == user_id)
	count_query = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)

	if read_filter == "read":
		query = query.where(Notification.is_read.is_(True))
		count_query = count_query.where(Notification.is_read.is_(True))
	elif read_filter == "unread":
		query = query.where(Notification.is_read.is_(False))
		count_query = count_query.where(Notification.is_read.is_(False))

	if type_filter != "all":
		query = query.where(Notification.type.ilike(f"{type_filter}_%"))
		count_query = count_query.where(Notification.type.ilike(f"{type_filter}_%"))

	count_result = await db.execute(count_query)
	total = int(count_result.scalar_one())

	result = await db.execute(
		query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
	)
	items = list(result.scalars().all())
	return items, total


async def create_notification(
	db: AsyncSession,
	user_id: uuid.UUID,
	type: NotificationType | str,
	title: str,
	message: str,
	data: dict | None = None,
) -> Notification:
	if isinstance(type, str):
		type = NotificationType(type)

	notification = Notification(
		user_id=user_id,
		type=type,
		title=title,
		message=message,
		data=data or {},
	)
	db.add(notification)
	await db.commit()
	await db.refresh(notification)

	try:
		payload = NotificationRead.model_validate(notification).model_dump(mode="json")
		await connection_manager.send_to_user(
			user_id,
			{
				"type": "notification:created",
				"data": {"notification": payload},
			},
		)
	except Exception:
		logger.exception("Failed to push notification:created for user %s", user_id)
	return notification


async def get_unread_count(db: AsyncSession, user_id: uuid.UUID) -> int:
	result = await db.execute(
		select(func.count())
		.select_from(Notification)
		.where(Notification.user_id == user_id, Notification.is_read.is_(False))
	)
	count = result.scalar_one()
	return int(count)


async def mark_notification_as_read(
	db: AsyncSession,
	notification_id: uuid.UUID,
	user_id: uuid.UUID,
) -> Notification | None:
	result = await db.execute(
		select(Notification).where(
			Notification.id == notification_id,
			Notification.user_id == user_id,
		)
	)
	notification = result.scalar_one_or_none()
	if not notification:
		return None

	notification.is_read = True
	db.add(notification)
	await db.commit()
	await db.refresh(notification)

	try:
		unread_count = await get_unread_count(db, user_id)
		await connection_manager.send_to_user(
			user_id,
			{
				"type": "notification:read",
				"data": {
					"notification_id": str(notification.id),
					"unread_count": unread_count,
				},
			},
		)
	except Exception:
		logger.exception("Failed to push notification:read for user %s", user_id)
	return notification


async def mark_all_notifications_as_read(db: AsyncSession, user_id: uuid.UUID) -> int:
	result = await db.execute(
		update(Notification)
		.where(Notification.user_id == user_id, Notification.is_read.is_(False))
		.values(is_read=True)
	)
	await db.commit()
	updated_count = int(result.rowcount or 0)
	if updated_count > 0:
		try:
			await connection_manager.send_to_user(
				user_id,
				{
					"type": "notification:read-all",
					"data": {
						"updated_count": updated_count,
						"unread_count": 0,
					},
				},
			)
		except Exception:
			logger.exception("Failed to push notification:read-all for user %s", user_id)

	return updated_count
