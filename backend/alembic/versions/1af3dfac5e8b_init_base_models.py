"""Init Base Models (baseline)

Revision ID: 1af3dfac5e8b
Revises:
Create Date: 2026-03-13 01:41:44.307743

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "1af3dfac5e8b"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Baseline revision kept as a no-op for existing databases."""
    return None


def downgrade() -> None:
    """No-op downgrade for baseline revision."""
    return None
