"""add_course_cover_fields

Revision ID: c8d3f5a7b9e1
Revises: b7a2d3e4f5a6
Create Date: 2026-07-16 23:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c8d3f5a7b9e1"
down_revision = "b7a2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add course cover image management fields
    op.add_column("courses", sa.Column("cover_image_source", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("cover_storage_key", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("cover_external_url", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("cover_mime_type", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("cover_updated_at", sa.DateTime(), nullable=True))
    op.create_index("ix_courses_cover_storage_key", "courses", ["cover_storage_key"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_courses_cover_storage_key", table_name="courses")
    op.drop_column("courses", "cover_updated_at")
    op.drop_column("courses", "cover_mime_type")
    op.drop_column("courses", "cover_external_url")
    op.drop_column("courses", "cover_storage_key")
    op.drop_column("courses", "cover_image_source")
