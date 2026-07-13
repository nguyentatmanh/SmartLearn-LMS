from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.course import CourseStatus, CourseLevel
from app.schemas.lesson import ChapterWithLessonsResponse


class CourseBase(BaseModel):
    title: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    level: CourseLevel = CourseLevel.BEGINNER
    specialization: Optional[str] = None
    estimated_duration: Optional[str] = None
    prerequisites: Optional[str] = None
    learning_outcomes: Optional[str] = None
    status: CourseStatus = CourseStatus.DRAFT


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    level: Optional[CourseLevel] = None
    specialization: Optional[str] = None
    estimated_duration: Optional[str] = None
    prerequisites: Optional[str] = None
    learning_outcomes: Optional[str] = None
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


class AdminCourseResponse(CourseResponse):
    teacher: CourseTeacherResponse
    enrollments_count: int
    lessons_count: int


class CourseStatusPatchRequest(BaseModel):
    status: CourseStatus

