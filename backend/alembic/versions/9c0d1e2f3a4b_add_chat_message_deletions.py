"""add chat message deletions

Revision ID: 9c0d1e2f3a4b
Revises: 9b1c2d3e4f5a
Create Date: 2026-05-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9c0d1e2f3a4b"
down_revision = "9b1c2d3e4f5a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_message_deletions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id", "user_id", name="uq_chat_message_deletions"),
    )
    op.create_index(
        "ix_chat_message_deletions_message_id",
        "chat_message_deletions",
        ["message_id"],
        unique=False,
    )
    op.create_index(
        "ix_chat_message_deletions_user_id",
        "chat_message_deletions",
        ["user_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_chat_message_deletions_message_id",
        "chat_message_deletions",
        "chat_messages",
        ["message_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_chat_message_deletions_user_id",
        "chat_message_deletions",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_chat_message_deletions_user_id", "chat_message_deletions", type_="foreignkey")
    op.drop_constraint("fk_chat_message_deletions_message_id", "chat_message_deletions", type_="foreignkey")
    op.drop_index("ix_chat_message_deletions_user_id", table_name="chat_message_deletions")
    op.drop_index("ix_chat_message_deletions_message_id", table_name="chat_message_deletions")
    op.drop_table("chat_message_deletions")
