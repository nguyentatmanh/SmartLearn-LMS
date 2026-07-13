from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.lesson import Chapter, Lesson
from app.schemas.lesson import ChapterCreate, ChapterUpdate, LessonCreate, LessonUpdate


# --- Chapter CRUD ---

def get_chapter(db: Session, chapter_id: int) -> Optional[Chapter]:
    """Retrieve a chapter by its ID."""
    return db.query(Chapter).filter(Chapter.id == chapter_id).first()


def get_chapters_by_course(db: Session, course_id: int) -> List[Chapter]:
    """Retrieve all chapters for a given course ordered by index."""
    return db.query(Chapter).filter(Chapter.course_id == course_id).order_by(Chapter.order_index).all()


def create_chapter(db: Session, obj_in: ChapterCreate, course_id: int) -> Chapter:
    """Create a new chapter for a course."""
    db_obj = Chapter(
        title=obj_in.title,
        description=obj_in.description,
        is_visible=obj_in.is_visible,
        order_index=obj_in.order_index,
        course_id=course_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_chapter(db: Session, db_obj: Chapter, obj_in: ChapterUpdate) -> Chapter:
    """Update a chapter's attributes."""
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_chapter(db: Session, chapter_id: int) -> Optional[Chapter]:
    """Delete a chapter from the database."""
    db_obj = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj


# --- Lesson CRUD ---

def get_lesson(db: Session, lesson_id: int) -> Optional[Lesson]:
    """Retrieve a lesson by its ID."""
    return db.query(Lesson).filter(Lesson.id == lesson_id).first()


def get_lessons_by_chapter(db: Session, chapter_id: int) -> List[Lesson]:
    """Retrieve all lessons inside a chapter ordered by index."""
    return db.query(Lesson).filter(Lesson.chapter_id == chapter_id).order_by(Lesson.order_index).all()


def create_lesson(db: Session, obj_in: LessonCreate, course_id: int) -> Lesson:
    """Create a new lesson inside a chapter for a course."""
    db_obj = Lesson(
        course_id=course_id,
        chapter_id=obj_in.chapter_id,
        title=obj_in.title,
        description=obj_in.description,
        content=obj_in.content,
        lesson_type=obj_in.lesson_type,
        estimated_duration_minutes=obj_in.estimated_duration_minutes,
        is_required=obj_in.is_required,
        is_visible=obj_in.is_visible,
        status=obj_in.status,
        order_index=obj_in.order_index,
        video_url=obj_in.video_url,
        document_url=obj_in.document_url
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_lesson(db: Session, db_obj: Lesson, obj_in: LessonUpdate) -> Lesson:
    """Update a lesson's attributes."""
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_lesson(db: Session, lesson_id: int) -> Optional[Lesson]:
    """Delete a lesson from the database."""
    db_obj = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj
