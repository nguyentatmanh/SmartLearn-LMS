from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


from app.models.lesson import LessonType, LessonStatus


# --- Lesson Schemas ---

class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    lesson_type: LessonType = LessonType.TEXT
    estimated_duration_minutes: int = 15
    is_required: bool = True
    is_visible: bool = True
    status: LessonStatus = LessonStatus.DRAFT
    order_index: int = 0
    video_url: Optional[str] = None
    document_url: Optional[str] = None


class LessonCreate(LessonBase):
    chapter_id: int


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    lesson_type: Optional[LessonType] = None
    estimated_duration_minutes: Optional[int] = None
    is_required: Optional[bool] = None
    is_visible: Optional[bool] = None
    status: Optional[LessonStatus] = None
    order_index: Optional[int] = None
    video_url: Optional[str] = None
    document_url: Optional[str] = None
    chapter_id: Optional[int] = None


class LessonResponse(LessonBase):
    id: int
    course_id: int
    chapter_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Chapter Schemas ---

class ChapterBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_visible: bool = True
    order_index: int = 0


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_visible: Optional[bool] = None
    order_index: Optional[int] = None


class ChapterResponse(ChapterBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChapterWithLessonsResponse(ChapterResponse):
    lessons: List[LessonResponse] = []

    model_config = ConfigDict(from_attributes=True)
