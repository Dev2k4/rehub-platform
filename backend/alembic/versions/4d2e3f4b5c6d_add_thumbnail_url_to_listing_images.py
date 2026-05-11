"""Add thumbnail url to listing images (idempotent)

Revision ID: 4d2e3f4b5c6d
Revises: 2b4f9a3d1e7c
Create Date: 2026-04-03 12:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4d2e3f4b5c6d"
down_revision: Union[str, Sequence[str], None] = "2b4f9a3d1e7c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("listing_images")}
    if "thumbnail_url" not in columns:
        op.add_column("listing_images", sa.Column("thumbnail_url", sa.String(length=255), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("listing_images")}
    if "thumbnail_url" in columns:
        op.drop_column("listing_images", "thumbnail_url")
