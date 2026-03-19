import uuid
from sqlalchemy import func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.notification import Notification


async def get_user_notifications(db: AsyncSession, user_id: uuid.UUID) -> list[Notification]:
	result = await db.execute(
		select(Notification)
		.where(Notification.user_id == user_id)
		.order_by(Notification.created_at.desc())
	)
	return list(result.scalars().all())


async def create_notification(
	db: AsyncSession,
	user_id: uuid.UUID,
	type: str,
	title: str,
	message: str,
	data: dict | None = None,
) -> Notification:
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
	return notification


async def mark_all_notifications_as_read(db: AsyncSession, user_id: uuid.UUID) -> int:
	result = await db.execute(
		update(Notification)
		.where(Notification.user_id == user_id, Notification.is_read.is_(False))
		.values(is_read=True)
	)
	await db.commit()
	return int(result.rowcount or 0)
