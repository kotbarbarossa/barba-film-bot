"""update movie processing

Revision ID: eb0ce2c49b7a
Revises: a201684c5a16
Create Date: 2026-04-17 15:05:31.651094

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = 'eb0ce2c49b7a'
down_revision: str | None = 'a201684c5a16'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE TYPE processingstatus AS ENUM ('PENDING', 'PROCESSED', 'UNRECOGNIZED')")

    op.add_column('movie', sa.Column('user_query', sa.Text(), nullable=False, server_default=''))
    op.alter_column('movie', 'user_query', server_default=None)

    op.add_column(
        'movie',
        sa.Column(
            'processing_status',
            sa.Enum(
                'PENDING',
                'PROCESSED',
                'UNRECOGNIZED',
                name='processingstatus',
                create_type=False,
            ),
            nullable=False,
            server_default='PENDING',
        ),
    )
    op.alter_column('movie', 'processing_status', server_default=None)

    op.alter_column(
        'movie',
        'media_type',
        existing_type=postgresql.ENUM('FILM', 'SERIES', name='mediatype'),
        nullable=True,
    )

    op.drop_constraint('title_required', 'movie', type_='check')


def downgrade() -> None:
    op.create_check_constraint(
        'title_required',
        'movie',
        'title_original IS NOT NULL OR title_ru IS NOT NULL',
    )

    op.alter_column(
        'movie',
        'media_type',
        existing_type=postgresql.ENUM('FILM', 'SERIES', name='mediatype'),
        nullable=False,
    )

    op.drop_column('movie', 'processing_status')
    op.drop_column('movie', 'user_query')

    op.execute('DROP TYPE processingstatus')
