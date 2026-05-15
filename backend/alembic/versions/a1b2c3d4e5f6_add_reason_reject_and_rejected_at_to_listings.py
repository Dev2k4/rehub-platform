"""add reason_reject and rejected_at to listings

Revision ID: a1b2c3d4e5f6
Revises: 8c9d0e1f2a3b
Create Date: 2026-05-15 09:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8c9d0e1f2a3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'listings',
        sa.Column('reason_reject', sa.String(length=1000), nullable=True)
    )
    op.add_column(
        'listings',
        sa.Column('rejected_at', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('listings', 'rejected_at')
    op.drop_column('listings', 'reason_reject')
