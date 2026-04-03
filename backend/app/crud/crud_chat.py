import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, func, or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.chat import ChatConversation, ChatConversationReadState, ChatMessage
from app.services.chat_crypto_service import generate_wrapped_conversation_key


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _normalize_pair(user_a_id: uuid.UUID, user_b_id: uuid.UUID) -> tuple[uuid.UUID, uuid.UUID]:
    a, b = sorted((str(user_a_id), str(user_b_id)))
    return uuid.UUID(a), uuid.UUID(b)


async def get_or_create_conversation(
    db: AsyncSession,
    user_a_id: uuid.UUID,
    user_b_id: uuid.UUID,
) -> ChatConversation:
    if user_a_id == user_b_id:
        raise ValueError("Cannot create self-conversation")

    pair_a, pair_b = _normalize_pair(user_a_id, user_b_id)
    result = await db.execute(
        select(ChatConversation).where(
            and_(
                ChatConversation.participant_a_id == pair_a,
                ChatConversation.participant_b_id == pair_b,
            )
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    conversation = ChatConversation(
        participant_a_id=pair_a,
        participant_b_id=pair_b,
        encrypted_dek=generate_wrapped_conversation_key(),
    )
    db.add(conversation)
    await db.flush()
    db.add(ChatConversationReadState(conversation_id=conversation.id, user_id=pair_a))
    db.add(ChatConversationReadState(conversation_id=conversation.id, user_id=pair_b))
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def get_read_state(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ChatConversationReadState | None:
    result = await db.execute(
        select(ChatConversationReadState).where(
            and_(
                ChatConversationReadState.conversation_id == conversation_id,
                ChatConversationReadState.user_id == user_id,
            )
        )
    )
    return result.scalar_one_or_none()


async def ensure_read_state(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ChatConversationReadState:
    existing = await get_read_state(db, conversation_id, user_id)
    if existing:
        return existing

    state = ChatConversationReadState(
        conversation_id=conversation_id,
        user_id=user_id,
    )
    db.add(state)
    await db.flush()
    return state


async def list_user_conversations(db: AsyncSession, user_id: uuid.UUID) -> list[ChatConversation]:
    result = await db.execute(
        select(ChatConversation)
        .where(
            or_(
                ChatConversation.participant_a_id == user_id,
                ChatConversation.participant_b_id == user_id,
            )
        )
        .order_by(ChatConversation.last_message_at.desc().nullslast(), ChatConversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def count_unread_messages(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> int:
    state = await get_read_state(db, conversation_id, user_id)

    query = (
        select(func.count())
        .select_from(ChatMessage)
        .where(
            and_(
                ChatMessage.conversation_id == conversation_id,
                ChatMessage.sender_id != user_id,
            )
        )
    )
    if state and state.last_read_at is not None:
        query = query.where(ChatMessage.created_at > state.last_read_at)

    result = await db.execute(query)
    return int(result.scalar_one())


async def get_conversation_for_user(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ChatConversation | None:
    result = await db.execute(
        select(ChatConversation).where(
            and_(
                ChatConversation.id == conversation_id,
                or_(
                    ChatConversation.participant_a_id == user_id,
                    ChatConversation.participant_b_id == user_id,
                ),
            )
        )
    )
    return result.scalar_one_or_none()


async def create_message_index(
    db: AsyncSession,
    message_id: uuid.UUID,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    object_key: str,
    size_bytes: int,
) -> ChatMessage:
    row = ChatMessage(
        id=message_id,
        conversation_id=conversation_id,
        sender_id=sender_id,
        object_key=object_key,
        size_bytes=size_bytes,
    )
    db.add(row)
    await db.flush()

    now = _utc_now_naive()
    await db.execute(
        update(ChatConversation)
        .where(ChatConversation.id == conversation_id)
        .values(updated_at=now, last_message_at=now)
    )

    await mark_conversation_read(db, conversation_id, sender_id, read_at=now)

    await db.commit()
    await db.refresh(row)
    return row


async def mark_conversation_read(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
    read_at: datetime | None = None,
) -> None:
    now = read_at or _utc_now_naive()
    state = await ensure_read_state(db, conversation_id, user_id)
    if state.last_read_at is None or state.last_read_at < now:
        state.last_read_at = now
    state.updated_at = _utc_now_naive()
    await db.flush()


async def list_messages(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    skip: int,
    limit: int,
) -> list[ChatMessage]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(result.scalars().all())
    items.reverse()
    return items


async def count_messages(db: AsyncSession, conversation_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
    )
    return int(result.scalar_one())
