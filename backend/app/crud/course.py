from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.course import Course, CourseStatus
from app.schemas.course import CourseCreate, CourseUpdate


def get_course(db: Session, course_id: int) -> Optional[Course]:
    """Retrieve a course by its unique ID."""
    return db.query(Course).filter(Course.id == course_id).first()


def get_courses(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    teacher_id: Optional[int] = None,
    status: Optional[CourseStatus] = None
) -> List[Course]:
    """Retrieve a list of courses with pagination and optional filters."""
    query = db.query(Course)
    if teacher_id is not None:
        query = query.filter(Course.teacher_id == teacher_id)
    if status is not None:
        query = query.filter(Course.status == status)
    return query.offset(skip).limit(limit).all()


def create_course(db: Session, obj_in: CourseCreate, teacher_id: int) -> Course:
    """Create a new course assigned to a specific teacher."""
    db_obj = Course(
        title=obj_in.title,
        description=obj_in.description,
        thumbnail_url=obj_in.thumbnail_url,
        status=obj_in.status,
        teacher_id=teacher_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_course(db: Session, db_obj: Course, obj_in: CourseUpdate) -> Course:
    """Update course attributes."""
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_course(db: Session, course_id: int) -> Optional[Course]:
    """Delete a course from the database."""
    db_obj = db.query(Course).filter(Course.id == course_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj
