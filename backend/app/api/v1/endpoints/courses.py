import os
import re
import uuid
import logging
import urllib.parse
from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func as sa_func
from app.core.database import get_db
from app.api import deps
from app.models.user import User, UserRole
from app.models.course import Course, CourseStatus
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson, LessonStatus
from app.models.progress import LessonProgress
from app.models.material import LearningMaterial
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse,
    CourseCoverExternalRequest, TeacherDashboardStats,
    CourseStudentProgress, StudentCourseProgressDetail, LessonProgressDetail,
)
from app.schemas.enrollment import EnrollmentResponse, CourseWithEnrollmentStatusResponse
from app.crud import course as crud_course
from app.crud import enrollment as crud_enrollment
from app.crud import progress as crud_progress
from app.storage.storage_service import get_storage_provider
from app.storage.exceptions import FileTooLargeError, StorageObjectNotFoundError

router = APIRouter()
logger = logging.getLogger(__name__)

COVER_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
COVER_ALLOWED_MIMES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp",
}
COVER_MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_external_cover_url(url: str) -> None:
    """Validate external cover URL: only http/https, valid hostname, no dangerous schemes."""
    if not url:
        raise HTTPException(status_code=400, detail="External cover URL cannot be empty.")
    if any(c in url for c in "\r\n\t\x00"):
        raise HTTPException(status_code=400, detail="URL contains invalid control characters.")
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed URL.")
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only http and https URLs are allowed.")
    if not parsed.netloc or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid URL: missing hostname.")
    normalized = url.lower().strip()
    for bad in ("javascript:", "data:", "file:", "ftp:", "vbscript:"):
        if normalized.startswith(bad):
            raise HTTPException(status_code=400, detail="URL scheme not allowed.")


def _get_published_visible_lesson_ids(db: Session, course_id: int) -> List[int]:
    """Get IDs of published + visible lessons for a course (for progress calculation)."""
    return [
        row[0] for row in
        db.query(Lesson.id).filter(
            Lesson.course_id == course_id,
            Lesson.status == LessonStatus.PUBLISHED,
            Lesson.is_visible == True,
        ).all()
    ]


# ========================
# Teacher Dashboard Stats
# ========================

@router.get("/teacher/my-stats", response_model=TeacherDashboardStats)
def get_teacher_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    Real statistics for the teacher dashboard.
    Counts courses by status, total enrolled students, total materials.
    """
    courses = crud_course.get_courses(db, teacher_id=current_user.id)
    course_ids = [c.id for c in courses]

    total = len(courses)
    published = sum(1 for c in courses if c.status == CourseStatus.PUBLISHED)
    draft = sum(1 for c in courses if c.status == CourseStatus.DRAFT)
    archived = sum(1 for c in courses if c.status == CourseStatus.ARCHIVED)

    # Total unique students enrolled in teacher's courses
    total_students = 0
    if course_ids:
        total_students = db.query(sa_func.count(sa_func.distinct(Enrollment.student_id))).filter(
            Enrollment.course_id.in_(course_ids)
        ).scalar() or 0

    # Total materials across teacher's courses
    total_materials = 0
    if course_ids:
        total_materials = db.query(sa_func.count(LearningMaterial.id)).filter(
            LearningMaterial.course_id.in_(course_ids)
        ).scalar() or 0

    return TeacherDashboardStats(
        total_courses=total,
        published_courses=published,
        draft_courses=draft,
        archived_courses=archived,
        total_students=total_students,
        total_materials=total_materials,
    )


# ========================
# Standard Course CRUD
# ========================

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
    return (
        db.query(Course)
        .options(
            selectinload(Course.chapters),
            selectinload(Course.lessons),
            selectinload(Course.enrollments)
        )
        .filter(Course.teacher_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


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


# ========================
# Course Cover Management
# ========================

@router.post("/{course_id}/cover/upload", response_model=CourseResponse)
async def upload_course_cover(
    course_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    Upload a course cover image. Replaces any existing cover.
    Allowed: JPEG, PNG, WebP. Max 5MB. 
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Validate file
    original_name = file.filename or "cover"
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in COVER_ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Accepted: {', '.join(COVER_ALLOWED_EXTENSIONS)}")
    if file.content_type not in COVER_ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail="MIME type not allowed for cover image.")

    # Check not empty
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Generate storage key
    stored_name = f"{uuid.uuid4()}{ext}"
    storage_key = f"course-covers/{course_id}/{stored_name}"
    old_storage_key = course.cover_storage_key

    storage = get_storage_provider()
    try:
        await run_in_threadpool(storage.save_stream, file.file, storage_key, COVER_MAX_SIZE_BYTES)
    except FileTooLargeError:
        raise HTTPException(status_code=413, detail="Cover image exceeds maximum size of 5 MB.")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to store cover image.")

    # Update database
    try:
        course.cover_image_source = "upload"
        course.cover_storage_key = storage_key
        course.cover_external_url = None
        course.cover_mime_type = file.content_type
        course.cover_updated_at = datetime.utcnow()
        db.add(course)
        db.commit()
        db.refresh(course)
    except Exception as db_err:
        db.rollback()
        # Remove newly uploaded file on DB failure
        try:
            await run_in_threadpool(storage.delete, storage_key)
        except Exception:
            logger.error(f"Failed to clean up new cover after DB error for course {course_id}")
        raise HTTPException(status_code=500, detail="Database update failed.")

    # Clean up old cover after successful commit
    if old_storage_key and old_storage_key != storage_key:
        try:
            await run_in_threadpool(storage.delete, old_storage_key)
        except Exception:
            logger.warning(f"Failed to clean up old cover for course {course_id}")

    return course


@router.patch("/{course_id}/cover/external", response_model=CourseResponse)
def set_external_cover(
    course_id: int,
    body: CourseCoverExternalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """Set an external URL as the course cover image."""
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied.")

    validate_external_cover_url(body.cover_external_url)

    old_storage_key = course.cover_storage_key

    course.cover_image_source = "external"
    course.cover_external_url = body.cover_external_url
    course.cover_storage_key = None
    course.cover_mime_type = None
    course.cover_updated_at = datetime.utcnow()
    db.add(course)
    db.commit()
    db.refresh(course)

    # Clean up old uploaded cover if switching from upload to external
    if old_storage_key:
        try:
            storage = get_storage_provider()
            storage.delete(old_storage_key)
        except Exception:
            logger.warning(f"Failed to clean up old uploaded cover for course {course_id}")

    return course


@router.delete("/{course_id}/cover", response_model=CourseResponse)
async def remove_course_cover(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """Remove the course cover image."""
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied.")

    old_storage_key = course.cover_storage_key

    course.cover_image_source = None
    course.cover_storage_key = None
    course.cover_external_url = None
    course.cover_mime_type = None
    course.cover_updated_at = None
    db.add(course)
    db.commit()
    db.refresh(course)

    if old_storage_key:
        try:
            storage = get_storage_provider()
            await run_in_threadpool(storage.delete, old_storage_key)
        except Exception:
            logger.warning(f"Failed to clean up cover file for course {course_id}")

    return course


@router.get("/{course_id}/cover")
async def stream_course_cover(
    course_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Stream the uploaded course cover image.
    Public access for published courses. Only streams uploaded covers.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.cover_image_source != "upload" or not course.cover_storage_key:
        raise HTTPException(status_code=404, detail="No uploaded cover image.")

    storage = get_storage_provider()
    try:
        file_exists = await run_in_threadpool(storage.exists, course.cover_storage_key)
    except Exception:
        file_exists = False

    if not file_exists:
        raise HTTPException(status_code=404, detail="Cover image file not found.")

    def chunk_generator():
        stream_gen = storage.open_stream(course.cover_storage_key)
        try:
            for chunk in stream_gen:
                yield chunk
        finally:
            if hasattr(stream_gen, "close"):
                stream_gen.close()

    return StreamingResponse(
        chunk_generator(),
        media_type=course.cover_mime_type or "image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


# ========================
# Course Student Roster
# ========================

@router.get("/{course_id}/students", response_model=List[CourseStudentProgress])
def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    List all students enrolled in a course with their progress.
    Only the course owner or admin can access this.
    Progress = completed published-visible lessons / total published-visible lessons.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Get published-visible lesson IDs for progress calculation
    pv_lesson_ids = _get_published_visible_lesson_ids(db, course_id)
    total_lessons = len(pv_lesson_ids)

    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    result = []
    for enroll in enrollments:
        student = enroll.student
        completed = 0
        if total_lessons > 0 and pv_lesson_ids:
            completed = db.query(sa_func.count(LessonProgress.id)).filter(
                LessonProgress.student_id == student.id,
                LessonProgress.lesson_id.in_(pv_lesson_ids),
                LessonProgress.is_completed == True,
            ).scalar() or 0

        progress_pct = (completed / total_lessons * 100) if total_lessons > 0 else 0.0

        result.append(CourseStudentProgress(
            student_id=student.id,
            full_name=student.full_name,
            email=student.email,
            enrolled_at=enroll.enrolled_at,
            completed_lessons=completed,
            total_lessons=total_lessons,
            progress_percentage=round(progress_pct, 2),
        ))

    return result


@router.get("/{course_id}/students/{student_id}", response_model=StudentCourseProgressDetail)
def get_student_course_progress(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    Get detailed per-lesson progress for a specific student in a course.
    Only the course owner or admin can access this.
    """
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied.")

    enroll = crud_enrollment.get_enrollment(db, student_id=student_id, course_id=course_id)
    if not enroll:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course.")

    student = enroll.student
    pv_lesson_ids = _get_published_visible_lesson_ids(db, course_id)
    total_lessons = len(pv_lesson_ids)

    # Get all published-visible lessons with chapter info
    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id,
        Lesson.status == LessonStatus.PUBLISHED,
        Lesson.is_visible == True,
    ).order_by(Lesson.order_index).all()

    # Get student progress records for these lessons
    progress_map = {}
    if pv_lesson_ids:
        progresses = db.query(LessonProgress).filter(
            LessonProgress.student_id == student_id,
            LessonProgress.lesson_id.in_(pv_lesson_ids),
        ).all()
        progress_map = {p.lesson_id: p for p in progresses}

    completed = sum(1 for p in progress_map.values() if p.is_completed)
    progress_pct = (completed / total_lessons * 100) if total_lessons > 0 else 0.0

    lesson_details = []
    for lesson in lessons:
        prog = progress_map.get(lesson.id)
        lesson_details.append(LessonProgressDetail(
            lesson_id=lesson.id,
            lesson_title=lesson.title,
            chapter_title=lesson.chapter.title if lesson.chapter else "—",
            is_completed=prog.is_completed if prog else False,
            completed_at=prog.completed_at if prog and prog.is_completed else None,
        ))

    return StudentCourseProgressDetail(
        student_id=student.id,
        full_name=student.full_name,
        email=student.email,
        enrolled_at=enroll.enrolled_at,
        completed_lessons=completed,
        total_lessons=total_lessons,
        progress_percentage=round(progress_pct, 2),
        lessons=lesson_details,
    )
