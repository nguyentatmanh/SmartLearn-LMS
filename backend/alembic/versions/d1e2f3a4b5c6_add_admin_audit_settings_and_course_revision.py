"""add_admin_audit_settings_and_course_revision

Revision ID: d1e2f3a4b5c6
Revises: c8d3f5a7b9e1
Create Date: 2026-07-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d1e2f3a4b5c6"
down_revision = "c8d3f5a7b9e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("target_type", sa.String(), nullable=False),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("result", sa.String(), nullable=False, server_default="success"),
        sa.Column("sanitized_details", sa.JSON(), nullable=True),
        sa.Column("request_id", sa.String(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"], unique=False)
    op.create_index(op.f("ix_audit_logs_event_type"), "audit_logs", ["event_type"], unique=False)
    op.create_index(op.f("ix_audit_logs_actor_id"), "audit_logs", ["actor_id"], unique=False)
    op.create_index(op.f("ix_audit_logs_target_type"), "audit_logs", ["target_type"], unique=False)
    op.create_index(op.f("ix_audit_logs_target_id"), "audit_logs", ["target_id"], unique=False)
    op.create_index(op.f("ix_audit_logs_result"), "audit_logs", ["result"], unique=False)
    op.create_index(op.f("ix_audit_logs_created_at"), "audit_logs", ["created_at"], unique=False)
    op.create_index("ix_audit_logs_target_type_id", "audit_logs", ["target_type", "target_id"], unique=False)

    # 2. Create system_settings table
    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("require_teacher_approval", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("require_email_verification", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("require_course_review", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.CheckConstraint("id = 1", name="single_row_system_settings"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id")
    )

    # Seed single settings row id=1 safely
    # Only enable require_email_verification if at least one active, email-verified admin exists to prevent admin lockout
    bind = op.get_bind()
    verified_admin_count = bind.execute(sa.text("""
        SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true AND email_verified = true
    """)).scalar() or 0

    require_email_verification = True if verified_admin_count > 0 else False

    bind.execute(
        sa.text("""
            INSERT INTO system_settings (id, require_teacher_approval, require_email_verification, require_course_review, updated_at)
            VALUES (1, true, :req_email, false, now())
            ON CONFLICT (id) DO NOTHING;
        """),
        {"req_email": require_email_verification}
    )

    # 3. Add course moderation & revision tracking columns
    op.add_column("courses", sa.Column("review_status", sa.String(), nullable=False, server_default="not_submitted"))
    op.add_column("courses", sa.Column("content_revision", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("courses", sa.Column("submitted_revision", sa.Integer(), nullable=True))
    op.add_column("courses", sa.Column("approved_revision", sa.Integer(), nullable=True))
    op.add_column("courses", sa.Column("submitted_for_review_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("courses", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("courses", sa.Column("reviewed_by", sa.Integer(), nullable=True))
    op.add_column("courses", sa.Column("review_note", sa.Text(), nullable=True))

    op.create_foreign_key("fk_courses_reviewed_by_users", "courses", "users", ["reviewed_by"], ["id"], ondelete="SET NULL")
    op.create_index(op.f("ix_courses_review_status"), "courses", ["review_status"], unique=False)


def downgrade() -> None:
    # Drop course moderation columns & indexes
    op.drop_index(op.f("ix_courses_review_status"), table_name="courses")
    op.drop_constraint("fk_courses_reviewed_by_users", "courses", type_="foreignkey")
    op.drop_column("courses", "review_note")
    op.drop_column("courses", "reviewed_by")
    op.drop_column("courses", "reviewed_at")
    op.drop_column("courses", "submitted_for_review_at")
    op.drop_column("courses", "approved_revision")
    op.drop_column("courses", "submitted_revision")
    op.drop_column("courses", "content_revision")
    op.drop_column("courses", "review_status")

    # Drop system_settings table
    op.drop_table("system_settings")

    # Drop audit_logs table
    op.drop_index("ix_audit_logs_target_type_id", table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_created_at"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_result"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_target_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_target_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_actor_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_event_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_id"), table_name="audit_logs")
    op.drop_table("audit_logs")
