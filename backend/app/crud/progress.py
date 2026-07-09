from typing import Optional, List
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.progress import LessonProgress
from app.models.lesson import Lesson


def get_lesson_progress(db: Session, student_id: int, lesson_id: int) -> Optional[LessonProgress]:
    """Retrieve progress record for a student on a specific lesson."""
    return db.query(LessonProgress).filter(
        LessonProgress.student_id == student_id,
        LessonProgress.lesson_id == lesson_id
    ).first()


def upsert_lesson_progress(db: Session, student_id: int, lesson_id: int, is_completed: bool) -> LessonProgress:
    """Create or update a lesson progress record."""
    db_obj = get_lesson_progress(db, student_id, lesson_id)
    if db_obj:
        db_obj.is_completed = is_completed
    else:
        db_obj = LessonProgress(
            student_id=student_id,
            lesson_id=lesson_id,
            is_completed=is_completed
        )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_completed_lessons_count(db: Session, student_id: int, course_id: int) -> int:
    """Count how many lessons a student has completed in a specific course."""
    return db.query(func.count(LessonProgress.id))\
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)\
        .filter(
            LessonProgress.student_id == student_id,
            Lesson.course_id == course_id,
            LessonProgress.is_completed == True
        ).scalar() or 0
