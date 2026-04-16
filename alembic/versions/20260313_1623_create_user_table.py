"""create user table

Revision ID: df50edb535df
Revises:
Create Date: 2026-03-13 16:23:06.855987

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'df50edb535df'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    authprovider = sa.Enum('TELEGRAM', name='authprovider')

    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('provider', authprovider, nullable=False),
        sa.Column('provider_user_id', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=64), nullable=True),
        sa.Column('first_name', sa.String(length=128), nullable=True),
        sa.Column('last_name', sa.String(length=128), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user')),
        sa.UniqueConstraint(
            'provider',
            'provider_user_id',
            name=op.f('uq_user_provider_user_id'),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user')
    sa.Enum(name='authprovider').drop(op.get_bind())
