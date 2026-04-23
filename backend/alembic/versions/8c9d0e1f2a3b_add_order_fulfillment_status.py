"""Add fulfillment status milestones to orders

Revision ID: 8c9d0e1f2a3b
Revises: 7b8c9d0e1f2a
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8c9d0e1f2a3b"
down_revision: Union[str, Sequence[str], None] = "7b8c9d0e1f2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_column(inspector, "orders", "fulfillment_status"):
        op.add_column(
            "orders",
            sa.Column("fulfillment_status", sa.String(length=50), nullable=True),
        )
    if not _has_column(inspector, "orders", "seller_marked_delivered_at"):
        op.add_column(
            "orders",
            sa.Column("seller_marked_delivered_at", sa.DateTime(), nullable=True),
        )
    if not _has_column(inspector, "orders", "buyer_confirmed_received_at"):
        op.add_column(
            "orders",
            sa.Column("buyer_confirmed_received_at", sa.DateTime(), nullable=True),
        )

    op.execute(
        """
        UPDATE orders
        SET fulfillment_status = CASE
            WHEN status = 'completed' THEN 'buyer_confirmed_received'
            WHEN status = 'cancelled' THEN 'cancelled'
            WHEN status = 'disputed' THEN 'disputed'
            ELSE 'created'
        END
        WHERE fulfillment_status IS NULL
        """
    )

    op.execute(
        """
        UPDATE orders o
        SET fulfillment_status = CASE e.status
            WHEN 'awaiting_funding' THEN 'awaiting_funding'
            WHEN 'held' THEN 'funded'
            WHEN 'release_pending' THEN 'seller_marked_delivered'
            WHEN 'released' THEN 'buyer_confirmed_received'
            WHEN 'refunded' THEN 'resolved_refund'
            WHEN 'disputed' THEN 'disputed'
            ELSE o.fulfillment_status
        END,
        seller_marked_delivered_at = CASE
            WHEN e.status IN ('release_pending', 'released') AND o.seller_marked_delivered_at IS NULL
            THEN o.updated_at
            ELSE o.seller_marked_delivered_at
        END,
        buyer_confirmed_received_at = CASE
            WHEN e.status = 'released' AND o.buyer_confirmed_received_at IS NULL
            THEN o.updated_at
            ELSE o.buyer_confirmed_received_at
        END
        FROM escrows e
        WHERE e.order_id = o.id
        """
    )

    op.alter_column("orders", "fulfillment_status", existing_type=sa.String(length=50), nullable=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("orders")}

    if "buyer_confirmed_received_at" in columns:
        op.drop_column("orders", "buyer_confirmed_received_at")
    if "seller_marked_delivered_at" in columns:
        op.drop_column("orders", "seller_marked_delivered_at")
    if "fulfillment_status" in columns:
        op.drop_column("orders", "fulfillment_status")
