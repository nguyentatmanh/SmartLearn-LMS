from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.course import CourseStatus
from app.schemas.lesson import ChapterWithLessonsResponse


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: CourseStatus = CourseStatus.DRAFT


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: Optional[CourseStatus] = None


class CourseInDBBase(CourseBase):
    id: int
    teacher_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseResponse(CourseInDBBase):
    pass


# Minimal Teacher Schema to embed in responses
class CourseTeacherResponse(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)




class CourseDetailResponse(CourseResponse):
    teacher: CourseTeacherResponse
    chapters: List[ChapterWithLessonsResponse] = []

