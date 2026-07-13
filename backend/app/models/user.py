import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    profile = relationship("UserProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    teacher_profile = relationship("TeacherProfile", uselist=False, foreign_keys="[TeacherProfile.user_id]", back_populates="user", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="teacher", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    lesson_progresses = relationship("LessonProgress", back_populates="student", cascade="all, delete-orphan")
    materials = relationship("LearningMaterial", back_populates="uploader")
