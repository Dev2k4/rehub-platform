import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.notification import Notification


async def get_user_notifications(db: AsyncSession, user_id: uuid.UUID) -> list[Notification]:
	result = await db.execute(select(Notification).where(Notification.user_id == user_id))
	return list(result.scalars().all())
