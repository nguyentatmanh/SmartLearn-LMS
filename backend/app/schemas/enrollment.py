from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EnrollmentCreate(BaseModel):
    course_id: int


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrolled_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CourseWithEnrollmentStatusResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str
    teacher_name: str
    is_enrolled: bool = False
    progress_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)
