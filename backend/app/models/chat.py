import uuid
from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


def _utc_now() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ChatConversation(SQLModel, table=True):
    __tablename__ = "chat_conversations"
    __table_args__ = (
        UniqueConstraint("participant_a_id", "participant_b_id", name="uq_chat_participants_pair"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    participant_a_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    participant_b_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    encrypted_dek: str = Field(max_length=2048)
    key_version: int = Field(default=1)
    last_message_at: datetime | None = None
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="chat_conversations.id", ondelete="CASCADE", index=True)
    sender_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    object_key: str = Field(max_length=512, unique=True)
    size_bytes: int = Field(default=0)
    created_at: datetime = Field(default_factory=_utc_now)


class ChatConversationReadState(SQLModel, table=True):
    __tablename__ = "chat_conversation_reads"
    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_chat_conversation_reads"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="chat_conversations.id", ondelete="CASCADE", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    last_read_at: datetime | None = None
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)
