"""Add duplicate image hash columns to listing_images

Revision ID: 7b8c9d0e1f2a
Revises: 6a1b2c3d4e5f
Create Date: 2026-04-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7b8c9d0e1f2a"
down_revision: Union[str, Sequence[str], None] = "6a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_column(inspector, "listing_images", "perceptual_hash"):
        op.add_column("listing_images", sa.Column("perceptual_hash", sa.String(length=32), nullable=True))

    if not _has_column(inspector, "listing_images", "image_md5"):
        op.add_column("listing_images", sa.Column("image_md5", sa.String(length=32), nullable=True))

    if not _has_index(inspector, "listing_images", "ix_listing_images_perceptual_hash"):
        op.create_index("ix_listing_images_perceptual_hash", "listing_images", ["perceptual_hash"])

    if not _has_index(inspector, "listing_images", "ix_listing_images_image_md5"):
        op.create_index("ix_listing_images_image_md5", "listing_images", ["image_md5"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_index(inspector, "listing_images", "ix_listing_images_image_md5"):
        op.drop_index("ix_listing_images_image_md5", table_name="listing_images")

    if _has_index(inspector, "listing_images", "ix_listing_images_perceptual_hash"):
        op.drop_index("ix_listing_images_perceptual_hash", table_name="listing_images")

    columns = {column["name"] for column in inspector.get_columns("listing_images")}
    if "image_md5" in columns:
        op.drop_column("listing_images", "image_md5")

    if "perceptual_hash" in columns:
        op.drop_column("listing_images", "perceptual_hash")