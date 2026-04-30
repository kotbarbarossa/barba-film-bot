"""add partial index on user_movie for global trending

Revision ID: a1b2c3d4e5f6
Revises: c7e2f4a1b9d3
Create Date: 2026-04-30 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: str | None = 'c7e2f4a1b9d3'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        'ix_user_movie_top',
        'user_movie',
        ['watched_at', 'movie_id', 'rating', 'rewatch_count'],
        postgresql_where=sa.text("status = 'WATCHED' AND rating IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index('ix_user_movie_top', table_name='user_movie')
