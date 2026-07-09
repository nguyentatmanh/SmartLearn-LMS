from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api import deps
from app.models.user import User, UserRole
from app.models.course import Course, CourseStatus
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse
from app.schemas.enrollment import EnrollmentResponse, CourseWithEnrollmentStatusResponse
from app.crud import course as crud_course
from app.crud import enrollment as crud_enrollment
from app.crud import progress as crud_progress

router = APIRouter()


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    *,
    db: Session = Depends(get_db),
    course_in: CourseCreate,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Create a new course. Only Teachers can create courses.
    """
    return crud_course.create_course(db=db, obj_in=course_in, teacher_id=current_user.id)


@router.get("/", response_model=List[CourseWithEnrollmentStatusResponse])
def read_courses(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve all courses.
    - Students see only PUBLISHED courses.
    - Teachers see all courses, but we add custom indicators for enrollments.
    """
    # Fetch courses
    if current_user.role == UserRole.STUDENT:
        # Students can only see published courses
        courses = crud_course.get_courses(db, skip=skip, limit=limit, status=CourseStatus.PUBLISHED)
    elif current_user.role == UserRole.TEACHER:
        # Teachers can see all courses (we can let them filter or see all)
        courses = crud_course.get_courses(db, skip=skip, limit=limit)
    else:
        # Admin sees all
        courses = crud_course.get_courses(db, skip=skip, limit=limit)
        
    result = []
    for c in courses:
        # Check enrollment status
        enroll = crud_enrollment.get_enrollment(db, student_id=current_user.id, course_id=c.id)
        is_enrolled = enroll is not None
        
        # Calculate progress if enrolled
        progress_pct = 0.0
        if is_enrolled:
            total_lessons = len(c.lessons)
            if total_lessons > 0:
                completed = crud_progress.get_completed_lessons_count(db, student_id=current_user.id, course_id=c.id)
                progress_pct = (completed / total_lessons) * 100
                
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "thumbnail_url": c.thumbnail_url,
            "status": c.status.value,
            "teacher_name": c.teacher.full_name,
            "is_enrolled": is_enrolled,
            "progress_percentage": round(progress_pct, 2)
        })
        
    return result


@router.get("/teacher/my-courses", response_model=List[CourseResponse])
def read_teacher_courses(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Get all courses created by the current teacher.
    """
    return crud_course.get_courses(db, skip=skip, limit=limit, teacher_id=current_user.id)


@router.get("/student/enrolled", response_model=List[CourseWithEnrollmentStatusResponse])
def read_student_enrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_student)
) -> Any:
    """
    Get all courses the current student is enrolled in.
    """
    enrollments = crud_enrollment.get_student_enrollments(db, student_id=current_user.id)
    result = []
    for enroll in enrollments:
        c = enroll.course
        # Calculate progress
        total_lessons = len(c.lessons)
        progress_pct = 0.0
        if total_lessons > 0:
            completed = crud_progress.get_completed_lessons_count(db, student_id=current_user.id, course_id=c.id)
            progress_pct = (completed / total_lessons) * 100
            
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "thumbnail_url": c.thumbnail_url,
            "status": c.status.value,
            "teacher_name": c.teacher.full_name,
            "is_enrolled": True,
            "progress_percentage": round(progress_pct, 2)
        })
    return result


@router.get("/{course_id}", response_model=CourseDetailResponse)
def read_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get course by ID.
    - Enforces object-level check: if DRAFT, only the owning teacher or admin can view it.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Check if course is draft
    if course.status == CourseStatus.DRAFT:
        if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Course is in draft mode."
            )
            
    return course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    *,
    db: Session = Depends(get_db),
    course_id: int,
    course_in: CourseUpdate,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Update a course.
    - Enforces object-level verification: Teachers can only update their own courses.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this course."
        )
        
    return crud_course.update_course(db=db, db_obj=course, obj_in=course_in)


@router.delete("/{course_id}", response_model=CourseResponse)
def delete_course(
    *,
    db: Session = Depends(get_db),
    course_id: int,
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Delete a course.
    - Enforces object-level verification: Teachers can only delete their own courses.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this course."
        )
        
    crud_course.delete_course(db=db, course_id=course_id)
    return course


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse)
def enroll_in_course(
    *,
    db: Session = Depends(get_db),
    course_id: int,
    current_user: User = Depends(deps.get_current_active_student)
) -> Any:
    """
    Enroll current student in a course.
    - Enforces that students can only enroll in PUBLISHED courses.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.status != CourseStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot enroll in an unpublished course."
        )
        
    # Check if already enrolled
    existing = crud_enrollment.get_enrollment(db, student_id=current_user.id, course_id=course_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already enrolled in this course."
        )
        
    return crud_enrollment.create_enrollment(db, student_id=current_user.id, course_id=course_id)
