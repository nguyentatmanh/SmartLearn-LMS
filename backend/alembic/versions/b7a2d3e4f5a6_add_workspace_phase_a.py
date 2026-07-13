"""add_workspace_phase_a

Revision ID: b7a2d3e4f5a6
Revises: a7f1bc3d5e90
Create Date: 2026-07-13 22:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b7a2d3e4f5a6"
down_revision = "a7f1bc3d5e90"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Update courses table
    op.add_column("courses", sa.Column("short_description", sa.Text(), nullable=True))
    op.add_column("courses", sa.Column("category", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("level", sa.String(), nullable=False, server_default="beginner"))
    op.add_column("courses", sa.Column("specialization", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("estimated_duration", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("prerequisites", sa.Text(), nullable=True))
    op.add_column("courses", sa.Column("learning_outcomes", sa.Text(), nullable=True))

    # 2. Update chapters table
    op.add_column("chapters", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("chapters", sa.Column("is_visible", sa.Boolean(), nullable=False, server_default="true"))

    # 3. Update lessons table
    op.add_column("lessons", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("lessons", sa.Column("lesson_type", sa.String(), nullable=False, server_default="text"))
    op.add_column("lessons", sa.Column("estimated_duration_minutes", sa.Integer(), nullable=False, server_default="15"))
    op.add_column("lessons", sa.Column("is_required", sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("lessons", sa.Column("is_visible", sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("lessons", sa.Column("status", sa.String(), nullable=False, server_default="draft"))

    # 4. Create learning_materials table
    op.create_table(
        "learning_materials",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("lesson_id", sa.Integer(), nullable=True),
        sa.Column("uploaded_by", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("original_filename", sa.String(), nullable=False),
        sa.Column("stored_filename", sa.String(), nullable=True),
        sa.Column("storage_key", sa.String(), nullable=True),
        sa.Column("mime_type", sa.String(), nullable=True),
        sa.Column("file_extension", sa.String(), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("external_url", sa.String(), nullable=True),
        sa.Column("material_type", sa.String(), nullable=False, server_default="document"),
        sa.Column("visibility", sa.String(), nullable=False, server_default="enrolled_students"),
        sa.Column("is_downloadable", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_key"),
        sa.CheckConstraint("size_bytes >= 0", name="check_size_bytes_non_negative")
    )

    # 5. Create indexes for learning_materials
    op.create_index(op.f("ix_learning_materials_id"), "learning_materials", ["id"], unique=False)
    op.create_index(op.f("ix_learning_materials_course_id"), "learning_materials", ["course_id"], unique=False)
    op.create_index(op.f("ix_learning_materials_lesson_id"), "learning_materials", ["lesson_id"], unique=False)
    op.create_index(op.f("ix_learning_materials_uploaded_by"), "learning_materials", ["uploaded_by"], unique=False)
    op.create_index(op.f("ix_learning_materials_is_active"), "learning_materials", ["is_active"], unique=False)
    op.create_index(op.f("ix_learning_materials_material_type"), "learning_materials", ["material_type"], unique=False)
    op.create_index(op.f("ix_learning_materials_visibility"), "learning_materials", ["visibility"], unique=False)
    op.create_index(op.f("ix_learning_materials_created_at"), "learning_materials", ["created_at"], unique=False)
    op.create_index(op.f("ix_learning_materials_storage_key"), "learning_materials", ["storage_key"], unique=True)


def downgrade() -> None:
    # 1. Drop indexes
    op.drop_index(op.f("ix_learning_materials_storage_key"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_created_at"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_visibility"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_material_type"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_is_active"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_uploaded_by"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_lesson_id"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_course_id"), table_name="learning_materials")
    op.drop_index(op.f("ix_learning_materials_id"), table_name="learning_materials")

    # 2. Drop table
    op.drop_table("learning_materials")

    # 3. Drop columns from lessons
    op.drop_column("lessons", "status")
    op.drop_column("lessons", "is_visible")
    op.drop_column("lessons", "is_required")
    op.drop_column("lessons", "estimated_duration_minutes")
    op.drop_column("lessons", "lesson_type")
    op.drop_column("lessons", "description")

    # 4. Drop columns from chapters
    op.drop_column("chapters", "is_visible")
    op.drop_column("chapters", "description")

    # 5. Drop columns from courses
    op.drop_column("courses", "learning_outcomes")
    op.drop_column("courses", "prerequisites")
    op.drop_column("courses", "estimated_duration")
    op.drop_column("courses", "specialization")
    op.drop_column("courses", "level")
    op.drop_column("courses", "category")
    op.drop_column("courses", "short_description")
