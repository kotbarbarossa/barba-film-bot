"""add user_auth_provider table

Revision ID: c7e2f4a1b9d3
Revises: f3a9c1d2e4b8
Create Date: 2026-04-28 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PgEnum

from alembic import op

revision: str = 'c7e2f4a1b9d3'
down_revision: str | Sequence[str] | None = 'f3a9c1d2e4b8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE authprovider ADD VALUE IF NOT EXISTS 'GOOGLE'")
    op.execute("ALTER TYPE authprovider ADD VALUE IF NOT EXISTS 'APPLE'")

    op.create_table(
        'user_auth_provider',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column(  # type: ignore[arg-type]
            'provider',
            PgEnum('TELEGRAM', 'GOOGLE', 'APPLE', name='authprovider', create_type=False),
            nullable=False,
        ),
        sa.Column('provider_user_id', sa.String(length=255), nullable=False),
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
        sa.ForeignKeyConstraint(
            ['user_id'], ['user.id'], name=op.f('fk_user_auth_provider_user_id_user')
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_auth_provider')),
        sa.UniqueConstraint(
            'provider',
            'provider_user_id',
            name=op.f('uq_user_auth_provider_provider'),
        ),
    )

    op.execute("""
        INSERT INTO user_auth_provider
            (user_id, provider, provider_user_id, created_at, updated_at)
        SELECT id, provider, provider_user_id, created_at, created_at
        FROM "user"
    """)

    op.add_column(
        'user',
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'),
    )

    op.drop_constraint('uq_user_provider', 'user', type_='unique')
    op.drop_column('user', 'provider')
    op.drop_column('user', 'provider_user_id')


def downgrade() -> None:
    """Downgrade schema."""
    authprovider = PgEnum('TELEGRAM', 'GOOGLE', 'APPLE', name='authprovider', create_type=False)
    op.add_column('user', sa.Column('provider', authprovider, nullable=True))
    op.add_column('user', sa.Column('provider_user_id', sa.String(length=255), nullable=True))

    op.execute("""
        UPDATE "user" u
        SET
            provider = uap.provider,
            provider_user_id = uap.provider_user_id
        FROM (
            SELECT DISTINCT ON (user_id)
                user_id, provider, provider_user_id
            FROM user_auth_provider
            ORDER BY user_id, CASE WHEN provider = 'TELEGRAM' THEN 0 ELSE 1 END
        ) uap
        WHERE u.id = uap.user_id
    """)

    op.alter_column('user', 'provider', nullable=False)
    op.alter_column('user', 'provider_user_id', nullable=False)
    op.create_unique_constraint('uq_user_provider', 'user', ['provider', 'provider_user_id'])

    op.drop_column('user', 'is_admin')
    op.drop_table('user_auth_provider')
