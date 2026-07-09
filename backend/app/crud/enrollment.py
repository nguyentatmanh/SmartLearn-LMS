from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.enrollment import Enrollment


def get_enrollment(db: Session, student_id: int, course_id: int) -> Optional[Enrollment]:
    """Retrieve an enrollment by student ID and course ID."""
    return db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id
    ).first()


def create_enrollment(db: Session, student_id: int, course_id: int) -> Enrollment:
    """Create a new enrollment record for a student in a course."""
    db_obj = Enrollment(
        student_id=student_id,
        course_id=course_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_student_enrollments(db: Session, student_id: int) -> List[Enrollment]:
    """Retrieve all course enrollments for a specific student."""
    return db.query(Enrollment).filter(Enrollment.student_id == student_id).all()


def delete_enrollment(db: Session, student_id: int, course_id: int) -> bool:
    """Remove an enrollment (disenroll a student)."""
    db_obj = get_enrollment(db, student_id, course_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False
