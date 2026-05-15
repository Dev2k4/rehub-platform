"""merge heads

Revision ID: 93a76695ae00
Revises: 9c0d1e2f3a4b, a1b2c3d4e5f6
Create Date: 2026-05-15 10:03:58.777922

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '93a76695ae00'
down_revision: Union[str, Sequence[str], None] = ('9c0d1e2f3a4b', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
