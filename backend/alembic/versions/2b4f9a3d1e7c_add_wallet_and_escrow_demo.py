"""Add wallet and escrow demo tables (idempotent)

Revision ID: 2b4f9a3d1e7c
Revises: 1af3dfac5e8b
Create Date: 2026-03-30 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "2b4f9a3d1e7c"
down_revision: Union[str, Sequence[str], None] = "1af3dfac5e8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_index(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(idx.get("name") == index_name for idx in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "wallet_accounts"):
        op.create_table(
            "wallet_accounts",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("available_balance", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
            sa.Column("locked_balance", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id"),
        )
    if not _has_index(inspector, "wallet_accounts", "ix_wallet_accounts_user_id"):
        op.create_index("ix_wallet_accounts_user_id", "wallet_accounts", ["user_id"], unique=False)

    if not _has_table(inspector, "wallet_transactions"):
        op.create_table(
            "wallet_transactions",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("type", sa.String(length=50), nullable=False),
            sa.Column("direction", sa.String(length=20), nullable=False),
            sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column("balance_after", sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column("metadata", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _has_index(inspector, "wallet_transactions", "ix_wallet_transactions_order_id"):
        op.create_index("ix_wallet_transactions_order_id", "wallet_transactions", ["order_id"], unique=False)
    if not _has_index(inspector, "wallet_transactions", "ix_wallet_transactions_user_id"):
        op.create_index("ix_wallet_transactions_user_id", "wallet_transactions", ["user_id"], unique=False)

    if not _has_table(inspector, "escrows"):
        op.create_table(
            "escrows",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="awaiting_funding"),
            sa.Column("funded_at", sa.DateTime(), nullable=True),
            sa.Column("released_at", sa.DateTime(), nullable=True),
            sa.Column("refunded_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("order_id"),
        )
    if not _has_index(inspector, "escrows", "ix_escrows_buyer_id"):
        op.create_index("ix_escrows_buyer_id", "escrows", ["buyer_id"], unique=False)
    if not _has_index(inspector, "escrows", "ix_escrows_order_id"):
        op.create_index("ix_escrows_order_id", "escrows", ["order_id"], unique=False)
    if not _has_index(inspector, "escrows", "ix_escrows_seller_id"):
        op.create_index("ix_escrows_seller_id", "escrows", ["seller_id"], unique=False)

    if not _has_table(inspector, "escrow_events"):
        op.create_table(
            "escrow_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("escrow_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("event_type", sa.String(length=50), nullable=False),
            sa.Column("note", sa.String(length=500), nullable=True),
            sa.Column("data", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["escrow_id"], ["escrows.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _has_index(inspector, "escrow_events", "ix_escrow_events_actor_id"):
        op.create_index("ix_escrow_events_actor_id", "escrow_events", ["actor_id"], unique=False)
    if not _has_index(inspector, "escrow_events", "ix_escrow_events_escrow_id"):
        op.create_index("ix_escrow_events_escrow_id", "escrow_events", ["escrow_id"], unique=False)


def downgrade() -> None:
    op.execute(sa.text('DROP TABLE IF EXISTS escrow_events CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS escrows CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS wallet_transactions CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS wallet_accounts CASCADE'))
