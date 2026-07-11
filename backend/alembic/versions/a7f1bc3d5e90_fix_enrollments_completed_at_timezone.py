"""fix enrollments completed_at timezone

Revision ID: a7f1bc3d5e90
Revises: 24c88e99ab31
Create Date: 2026-07-11 17:36:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a7f1bc3d5e90"
down_revision = "24c88e99ab31"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "enrollments",
        "completed_at",
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
        postgresql_using="completed_at AT TIME ZONE 'UTC'",
    )


def downgrade() -> None:
    op.alter_column(
        "enrollments",
        "completed_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        existing_nullable=True,
    )
