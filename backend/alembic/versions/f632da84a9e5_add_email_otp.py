"""add email otp

Revision ID: f632da84a9e5
Revises: 99823908ea83
Create Date: 2026-07-10 09:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f632da84a9e5'
down_revision = '99823908ea83'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add email_verified and is_approved to users table with defaults
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), server_default=sa.text('false'), nullable=False))

    # 2. Backfill existing users to True so developers/users are not locked out
    op.execute("UPDATE users SET email_verified = true, is_approved = true")

    # 3. Create email_verification_otps table
    op.create_table(
        'email_verification_otps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('otp_hash', sa.String(), nullable=False),
        sa.Column('purpose', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=False),
        sa.Column('resend_available_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 4. Create indexes
    op.create_index(op.f('ix_email_verification_otps_id'), 'email_verification_otps', ['id'], unique=False)
    op.create_index(op.f('ix_email_verification_otps_user_id'), 'email_verification_otps', ['user_id'], unique=False)
    op.create_index(op.f('ix_email_verification_otps_email'), 'email_verification_otps', ['email'], unique=False)
    op.create_index(op.f('ix_email_verification_otps_expires_at'), 'email_verification_otps', ['expires_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_email_verification_otps_expires_at'), table_name='email_verification_otps')
    op.drop_index(op.f('ix_email_verification_otps_email'), table_name='email_verification_otps')
    op.drop_index(op.f('ix_email_verification_otps_user_id'), table_name='email_verification_otps')
    op.drop_index(op.f('ix_email_verification_otps_id'), table_name='email_verification_otps')
    
    # Drop tables & columns
    op.drop_table('email_verification_otps')
    op.drop_column('users', 'is_approved')
    op.drop_column('users', 'email_verified')
