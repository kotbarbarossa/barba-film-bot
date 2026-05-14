"""add description_original and poster_url_original to movie

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-14 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'b2c3d4e5f6a7'
down_revision: str | None = 'a1b2c3d4e5f6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('movie', sa.Column('description_original', sa.Text(), nullable=True))
    op.add_column('movie', sa.Column('poster_url_original', sa.String(1024), nullable=True))


def downgrade() -> None:
    op.drop_column('movie', 'poster_url_original')
    op.drop_column('movie', 'description_original')
