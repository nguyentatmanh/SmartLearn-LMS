from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api import deps
from app.models.user import User, UserRole
from app.schemas.lesson import (
    ChapterCreate, ChapterUpdate, ChapterResponse,
    LessonCreate, LessonUpdate, LessonResponse
)
from app.crud import course as crud_course
from app.crud import lesson as crud_lesson
from app.crud import enrollment as crud_enrollment

router = APIRouter()


# --- Chapter Endpoints ---

@router.post("/courses/{course_id}/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(
    *,
    db: Session = Depends(get_db),
    course_id: int,
    chapter_in: ChapterCreate,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Create a chapter in a course. Only the owning Teacher can do this.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this course."
        )
        
    return crud_lesson.create_chapter(db, obj_in=chapter_in, course_id=course_id)


@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
def update_chapter(
    *,
    db: Session = Depends(get_db),
    chapter_id: int,
    chapter_in: ChapterUpdate,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Update a chapter. Only the course Teacher can do this.
    """
    chapter = crud_lesson.get_chapter(db, chapter_id=chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    course = chapter.course
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own the parent course."
        )
        
    return crud_lesson.update_chapter(db, db_obj=chapter, obj_in=chapter_in)


@router.delete("/chapters/{chapter_id}", response_model=ChapterResponse)
def delete_chapter(
    *,
    db: Session = Depends(get_db),
    chapter_id: int,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Delete a chapter. Only the course Teacher can do this.
    Only allows deleting empty chapters.
    """
    chapter = crud_lesson.get_chapter(db, chapter_id=chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    course = chapter.course
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own the parent course."
        )
        
    # Check dependencies: no lessons inside
    if len(chapter.lessons) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete chapter containing lessons. Please delete or move lessons first."
        )
        
    crud_lesson.delete_chapter(db, chapter_id=chapter_id)
    return chapter


# --- Lesson Endpoints ---

@router.post("/courses/{course_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    *,
    db: Session = Depends(get_db),
    course_id: int,
    lesson_in: LessonCreate,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Create a lesson inside a course and chapter. Only the course Teacher can do this.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this course."
        )
        
    # Validate chapter belongs to this course
    chapter = crud_lesson.get_chapter(db, chapter_id=lesson_in.chapter_id)
    if not chapter or chapter.course_id != course_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid chapter ID. Chapter must belong to the specified course."
        )
        
    return crud_lesson.create_lesson(db, obj_in=lesson_in, course_id=course_id)


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def read_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Read lesson details.
    - Teachers can read lessons of their own courses.
    - Students can ONLY read lessons if they are enrolled in the course.
    """
    lesson = crud_lesson.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    course = lesson.course
    
    # Enforce object-level verification
    if current_user.role == UserRole.STUDENT:
        enrollment = crud_enrollment.get_enrollment(db, student_id=current_user.id, course_id=course.id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You must enroll in the course to view this lesson."
            )
    elif current_user.role == UserRole.TEACHER:
        if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this course."
            )
            
    return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    *,
    db: Session = Depends(get_db),
    lesson_id: int,
    lesson_in: LessonUpdate,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Update a lesson. Only the course Teacher can do this.
    """
    lesson = crud_lesson.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    course = lesson.course
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this course."
        )
        
    if lesson_in.chapter_id is not None:
        chapter = crud_lesson.get_chapter(db, chapter_id=lesson_in.chapter_id)
        if not chapter or chapter.course_id != course.id:
            raise HTTPException(
                status_code=400,
                detail="Invalid chapter ID. Chapter must belong to the same course."
            )
            
    return crud_lesson.update_lesson(db, db_obj=lesson, obj_in=lesson_in)


@router.delete("/lessons/{lesson_id}", response_model=LessonResponse)
def delete_lesson(
    *,
    db: Session = Depends(get_db),
    lesson_id: int,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Delete a lesson. Only the course Teacher can do this.
    Only allows deleting lessons without materials or student progress.
    """
    lesson = crud_lesson.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    course = lesson.course
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this course."
        )
        
    # Check dependencies: no materials attached
    if len(lesson.materials) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete lesson with attached learning materials. Archive or delete materials first."
        )
        
    # Check progress dependency: no student progress
    if len(lesson.progresses) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete lesson because students have learning progress associated with it."
        )
        
    crud_lesson.delete_lesson(db, lesson_id=lesson_id)
    return lesson
