from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    require_teacher_approval = Column(Boolean, nullable=False, default=True)
    require_email_verification = Column(Boolean, nullable=False, default=True)
    require_course_review = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    updater = relationship("User", foreign_keys=[updated_by])

    __table_args__ = (
        CheckConstraint("id = 1", name="single_row_system_settings"),
    )
