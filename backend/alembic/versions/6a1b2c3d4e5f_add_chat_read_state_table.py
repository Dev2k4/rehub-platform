"""Add chat read state table (idempotent)

Revision ID: 6a1b2c3d4e5f
Revises: 5e6f7a8b9c0d
Create Date: 2026-04-03 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6a1b2c3d4e5f"
down_revision: Union[str, Sequence[str], None] = "5e6f7a8b9c0d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_index(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(idx.get("name") == index_name for idx in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "chat_conversation_reads"):
        op.create_table(
            "chat_conversation_reads",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("conversation_id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("last_read_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["conversation_id"], ["chat_conversations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("conversation_id", "user_id", name="uq_chat_conversation_reads"),
        )

    if not _has_index(inspector, "chat_conversation_reads", "ix_chat_conversation_reads_conversation_id"):
        op.create_index("ix_chat_conversation_reads_conversation_id", "chat_conversation_reads", ["conversation_id"])
    if not _has_index(inspector, "chat_conversation_reads", "ix_chat_conversation_reads_user_id"):
        op.create_index("ix_chat_conversation_reads_user_id", "chat_conversation_reads", ["user_id"])


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS chat_conversation_reads CASCADE"))
