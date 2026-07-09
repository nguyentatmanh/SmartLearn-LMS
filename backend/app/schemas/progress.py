from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LessonProgressCreate(BaseModel):
    lesson_id: int
    is_completed: bool = True


class LessonProgressResponse(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    is_completed: bool
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)
