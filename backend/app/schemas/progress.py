from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LessonProgressCreate(BaseModel):
    lesson_id: int
    is_completed: bool = True


class LessonProgressResponse(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
