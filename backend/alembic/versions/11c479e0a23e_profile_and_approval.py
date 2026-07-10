"""profile and approval

Revision ID: 11c479e0a23e
Revises: f632da84a9e5
Create Date: 2026-07-10 09:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '11c479e0a23e'
down_revision = 'f632da84a9e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create user_profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_profiles_id'), 'user_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_user_profiles_user_id'), 'user_profiles', ['user_id'], unique=True)
    op.create_index(op.f('ix_user_profiles_phone_number'), 'user_profiles', ['phone_number'], unique=False)

    # 2. Create teacher_profiles table
    op.create_table(
        'teacher_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('faculty', sa.String(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('specialization', sa.String(), nullable=False),
        sa.Column('academic_title', sa.String(), nullable=True),
        sa.Column('teacher_code', sa.String(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('approval_status', sa.Enum('pending', 'approved', 'rejected', name='teacherapprovalstatus', native_enum=False), nullable=False),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('teacher_code')
    )
    op.create_index(op.f('ix_teacher_profiles_id'), 'teacher_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_teacher_profiles_user_id'), 'teacher_profiles', ['user_id'], unique=True)
    op.create_index(op.f('ix_teacher_profiles_teacher_code'), 'teacher_profiles', ['teacher_code'], unique=True)
    op.create_index(op.f('ix_teacher_profiles_approval_status'), 'teacher_profiles', ['approval_status'], unique=False)

    # 3. Backfill existing user profiles copying full_name
    op.execute("""
        INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
        SELECT id, full_name, created_at, updated_at FROM users
    """)

    # 4. Backfill existing teachers as approved
    # Use lowercase string 'approved' or matching Enum value representation since native_enum=False maps directly to VARCHAR.
    op.execute("""
        INSERT INTO teacher_profiles (user_id, faculty, department, specialization, approval_status, created_at, updated_at)
        SELECT id, 'General Faculty', 'General Department', 'General Specialization', 'approved', created_at, updated_at FROM users WHERE role = 'teacher'
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_teacher_profiles_approval_status'), table_name='teacher_profiles')
    op.drop_index(op.f('ix_teacher_profiles_teacher_code'), table_name='teacher_profiles')
    op.drop_index(op.f('ix_teacher_profiles_user_id'), table_name='teacher_profiles')
    op.drop_index(op.f('ix_teacher_profiles_id'), table_name='teacher_profiles')
    op.drop_table('teacher_profiles')

    op.drop_index(op.f('ix_user_profiles_phone_number'), table_name='user_profiles')
    op.drop_index(op.f('ix_user_profiles_user_id'), table_name='user_profiles')
    op.drop_index(op.f('ix_user_profiles_id'), table_name='user_profiles')
    op.drop_table('user_profiles')
