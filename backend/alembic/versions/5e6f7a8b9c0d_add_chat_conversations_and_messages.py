"""Add chat conversations and messages (idempotent)

Revision ID: 5e6f7a8b9c0d
Revises: 4d2e3f4b5c6d
Create Date: 2026-04-03 13:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5e6f7a8b9c0d"
down_revision: Union[str, Sequence[str], None] = "4d2e3f4b5c6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_index(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(idx.get("name") == index_name for idx in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "chat_conversations"):
        op.create_table(
            "chat_conversations",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("participant_a_id", sa.UUID(), nullable=False),
            sa.Column("participant_b_id", sa.UUID(), nullable=False),
            sa.Column("encrypted_dek", sa.String(length=2048), nullable=False),
            sa.Column("key_version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("last_message_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["participant_a_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["participant_b_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("participant_a_id", "participant_b_id", name="uq_chat_participants_pair"),
        )

    if not _has_index(inspector, "chat_conversations", "ix_chat_conversations_participant_a_id"):
        op.create_index("ix_chat_conversations_participant_a_id", "chat_conversations", ["participant_a_id"])
    if not _has_index(inspector, "chat_conversations", "ix_chat_conversations_participant_b_id"):
        op.create_index("ix_chat_conversations_participant_b_id", "chat_conversations", ["participant_b_id"])

    if not _has_table(inspector, "chat_messages"):
        op.create_table(
            "chat_messages",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("conversation_id", sa.UUID(), nullable=False),
            sa.Column("sender_id", sa.UUID(), nullable=False),
            sa.Column("object_key", sa.String(length=512), nullable=False),
            sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["conversation_id"], ["chat_conversations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("object_key"),
        )

    if not _has_index(inspector, "chat_messages", "ix_chat_messages_conversation_id"):
        op.create_index("ix_chat_messages_conversation_id", "chat_messages", ["conversation_id"])
    if not _has_index(inspector, "chat_messages", "ix_chat_messages_sender_id"):
        op.create_index("ix_chat_messages_sender_id", "chat_messages", ["sender_id"])


def downgrade() -> None:
    op.execute(sa.text('DROP TABLE IF EXISTS chat_messages CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS chat_conversations CASCADE'))
