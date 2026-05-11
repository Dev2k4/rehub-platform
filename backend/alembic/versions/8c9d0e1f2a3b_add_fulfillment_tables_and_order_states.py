"""Add fulfillment tables and extend order status values

Revision ID: 8c9d0e1f2a3b
Revises: 7b8c9d0e1f2a
Create Date: 2026-04-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8c9d0e1f2a3b"
down_revision: Union[str, Sequence[str], None] = "7b8c9d0e1f2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "fulfillments"):
        op.create_table(
            "fulfillments",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("order_id", sa.Uuid(), nullable=False),
            sa.Column("buyer_id", sa.Uuid(), nullable=False),
            sa.Column("seller_id", sa.Uuid(), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="pending_seller_start"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("order_id"),
        )
        op.create_index("ix_fulfillments_order_id", "fulfillments", ["order_id"])
        op.create_index("ix_fulfillments_buyer_id", "fulfillments", ["buyer_id"])
        op.create_index("ix_fulfillments_seller_id", "fulfillments", ["seller_id"])

    if not _has_table(inspector, "fulfillment_events"):
        op.create_table(
            "fulfillment_events",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("fulfillment_id", sa.Uuid(), nullable=False),
            sa.Column("actor_id", sa.Uuid(), nullable=True),
            sa.Column("event_type", sa.String(length=50), nullable=False),
            sa.Column("note", sa.String(length=500), nullable=True),
            sa.Column("data", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["fulfillment_id"], ["fulfillments.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_fulfillment_events_fulfillment_id", "fulfillment_events", ["fulfillment_id"])
        op.create_index("ix_fulfillment_events_actor_id", "fulfillment_events", ["actor_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_table(inspector, "fulfillment_events"):
        op.drop_index("ix_fulfillment_events_actor_id", table_name="fulfillment_events")
        op.drop_index("ix_fulfillment_events_fulfillment_id", table_name="fulfillment_events")
        op.drop_table("fulfillment_events")

    if _has_table(inspector, "fulfillments"):
        op.drop_index("ix_fulfillments_seller_id", table_name="fulfillments")
        op.drop_index("ix_fulfillments_buyer_id", table_name="fulfillments")
        op.drop_index("ix_fulfillments_order_id", table_name="fulfillments")
        op.drop_table("fulfillments")
