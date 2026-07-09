from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.schemas.progress import LessonProgressCreate, LessonProgressResponse
from app.crud import lesson as crud_lesson
from app.crud import enrollment as crud_enrollment
from app.crud import progress as crud_progress

router = APIRouter()


@router.post("/", response_model=LessonProgressResponse)
def update_lesson_progress(
    *,
    db: Session = Depends(get_db),
    progress_in: LessonProgressCreate,
    current_user: User = Depends(deps.get_current_active_student)
) -> Any:
    """
    Mark a lesson as completed.
    - Only Students can log progress.
    - Enforces enrollment check: student must be enrolled in the lesson's course.
    """
    # Fetch lesson
    lesson = crud_lesson.get_lesson(db, lesson_id=progress_in.lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Check if student is enrolled in the parent course
    enrollment = crud_enrollment.get_enrollment(db, student_id=current_user.id, course_id=lesson.course_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You must be enrolled in the course to log progress on this lesson."
        )
        
    return crud_progress.upsert_lesson_progress(
        db, 
        student_id=current_user.id, 
        lesson_id=progress_in.lesson_id, 
        is_completed=progress_in.is_completed
    )
