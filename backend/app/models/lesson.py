import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, Enum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class LessonType(str, enum.Enum):
    TEXT = "text"
    VIDEO_URL = "video_url"
    UPLOADED_VIDEO = "uploaded_video"
    DOCUMENT = "document"
    MIXED = "mixed"


class LessonStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_visible = Column(Boolean, default=True, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    course = relationship("Course", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan", order_by="Lesson.order_index")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    lesson_type = Column(Enum(LessonType, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=LessonType.TEXT, nullable=False)
    estimated_duration_minutes = Column(Integer, default=15, nullable=False)
    is_required = Column(Boolean, default=True, nullable=False)
    is_visible = Column(Boolean, default=True, nullable=False)
    status = Column(Enum(LessonStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=LessonStatus.DRAFT, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    
    video_url = Column(String, nullable=True)
    document_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    course = relationship("Course", back_populates="lessons")
    chapter = relationship("Chapter", back_populates="lessons")
    progresses = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    materials = relationship("LearningMaterial", back_populates="lesson", cascade="all, delete-orphan")


