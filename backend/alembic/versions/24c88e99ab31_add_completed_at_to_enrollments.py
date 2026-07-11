"""add completed_at to enrollments

Revision ID: 24c88e99ab31
Revises: 11c479e0a23e
Create Date: 2026-07-11 17:28:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "24c88e99ab31"
down_revision = "11c479e0a23e"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [column["name"] for column in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if not _has_column("enrollments", "completed_at"):
        op.add_column(
            "enrollments",
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    if _has_column("enrollments", "completed_at"):
        op.drop_column("enrollments", "completed_at")
