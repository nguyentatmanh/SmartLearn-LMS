import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class CourseLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    short_description = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    level = Column(Enum(CourseLevel, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=CourseLevel.BEGINNER, nullable=False)
    specialization = Column(String, nullable=True)
    estimated_duration = Column(String, nullable=True)
    prerequisites = Column(Text, nullable=True)
    learning_outcomes = Column(Text, nullable=True)
    status = Column(Enum(CourseStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=CourseStatus.DRAFT, nullable=False)
    
    # Cover image fields
    cover_image_source = Column(String, nullable=True)  # "upload" | "external"
    cover_storage_key = Column(String, nullable=True, unique=True, index=True)
    cover_external_url = Column(String, nullable=True)
    cover_mime_type = Column(String, nullable=True)
    cover_updated_at = Column(DateTime, nullable=True)

    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    teacher = relationship("User", back_populates="courses")
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan", order_by="Chapter.order_index")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    materials = relationship("LearningMaterial", back_populates="course", cascade="all, delete-orphan")
