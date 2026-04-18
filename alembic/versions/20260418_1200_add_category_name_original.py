"""update category: add name_original, drop slug

Revision ID: f3a9c1d2e4b8
Revises: eb0ce2c49b7a
Create Date: 2026-04-18 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'f3a9c1d2e4b8'
down_revision: str | None = 'eb0ce2c49b7a'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('category', sa.Column('name_original', sa.String(128), nullable=True))
    op.create_unique_constraint('uq_category_name_original', 'category', ['name_original'])
    op.drop_constraint('uq_category_slug', 'category', type_='unique')
    op.drop_column('category', 'slug')


def downgrade() -> None:
    op.add_column('category', sa.Column('slug', sa.String(128), nullable=False, server_default=''))
    op.create_unique_constraint('uq_category_slug', 'category', ['slug'])
    op.alter_column('category', 'slug', server_default=None)
    op.drop_constraint('uq_category_name_original', 'category', type_='unique')
    op.drop_column('category', 'name_original')
