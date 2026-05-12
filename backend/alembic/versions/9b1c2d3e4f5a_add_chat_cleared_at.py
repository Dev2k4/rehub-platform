"""add chat cleared_at

Revision ID: 9b1c2d3e4f5a
Revises: 6a1b2c3d4e5f
Create Date: 2026-05-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9b1c2d3e4f5a"
down_revision = "6a1b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chat_conversation_reads",
        sa.Column("cleared_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("chat_conversation_reads", "cleared_at")
