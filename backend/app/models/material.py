import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, Enum, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class MaterialType(str, enum.Enum):
    SYLLABUS = "syllabus"
    SLIDE = "slide"
    DOCUMENT = "document"
    SOURCE_CODE = "source_code"
    DATASET = "dataset"
    IMAGE = "image"
    VIDEO = "video"
    EXTERNAL_LINK = "external_link"
    OTHER = "other"


class MaterialVisibility(str, enum.Enum):
    TEACHER_ONLY = "teacher_only"
    ENROLLED_STUDENTS = "enrolled_students"
    PUBLIC = "public"


class LearningMaterial(Base):
    __tablename__ = "learning_materials"

    id = Column(Integer, primary_key=True, index=True)
    
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=True)
    storage_key = Column(String, nullable=True, unique=True, index=True)
    
    mime_type = Column(String, nullable=True)
    file_extension = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True, index=False)
    external_url = Column(String, nullable=True)
    
    material_type = Column(Enum(MaterialType, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=MaterialType.DOCUMENT, nullable=False, index=True)
    visibility = Column(Enum(MaterialVisibility, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=MaterialVisibility.ENROLLED_STUDENTS, nullable=False, index=True)
    
    is_downloadable = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True) # Soft delete/archive
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Database Check Constraint to ensure size_bytes is never negative
    __table_args__ = (
        CheckConstraint("size_bytes >= 0", name="check_size_bytes_non_negative"),
    )

    # Relationships
    course = relationship("Course", back_populates="materials")
    lesson = relationship("Lesson", back_populates="materials")
    uploader = relationship("User", back_populates="materials")
