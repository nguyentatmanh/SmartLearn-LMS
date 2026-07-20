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


class CourseReviewStatus(str, enum.Enum):
    NOT_SUBMITTED = "not_submitted"
    PENDING = "pending"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"


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

    # Moderation & Revision Tracking
    review_status = Column(
        Enum(CourseReviewStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=CourseReviewStatus.NOT_SUBMITTED,
        nullable=False,
        server_default="not_submitted",
        index=True
    )
    content_revision = Column(Integer, nullable=False, default=1, server_default="1")
    submitted_revision = Column(Integer, nullable=True)
    approved_revision = Column(Integer, nullable=True)
    submitted_for_review_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_note = Column(Text, nullable=True)

    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="courses")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan", order_by="Chapter.order_index")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    materials = relationship("LearningMaterial", back_populates="course", cascade="all, delete-orphan")
