import enum
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class TeacherApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True, index=True)
    date_of_birth = Column(Date, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="profile")


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    faculty = Column(String, nullable=False)
    department = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    academic_title = Column(String, nullable=True)
    teacher_code = Column(String, unique=True, nullable=True, index=True)
    bio = Column(Text, nullable=True)
    approval_status = Column(
        Enum(TeacherApprovalStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]), 
        default=TeacherApprovalStatus.PENDING, 
        nullable=False,
        index=True
    )
    
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="teacher_profile")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
