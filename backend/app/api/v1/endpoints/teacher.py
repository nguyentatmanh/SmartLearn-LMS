from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.services.teacher_service import TeacherService
from app.schemas.teacher import (
    TeacherDashboardStatsResponse,
    PaginatedTeacherStudentResponse,
    TeacherStudentDetailResponse,
    TeacherAnalyticsResponse,
    ProgressStatusFilter,
    StudentSortBy,
    SortOrder,
)

router = APIRouter()


@router.get("/stats", response_model=TeacherDashboardStatsResponse)
def get_teacher_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    Get consolidated statistics for the current approved teacher dashboard.
    """
    return TeacherService.get_stats(db, teacher_id=current_user.id)


@router.get("/students", response_model=PaginatedTeacherStudentResponse)
def get_teacher_students(
    *,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: Optional[str] = Query(None),
    course_id: Optional[int] = Query(None),
    progress_status: ProgressStatusFilter = Query("all"),
    sort_by: StudentSortBy = Query("enrolled_at"),
    sort_order: SortOrder = Query("desc"),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    Get paginated student roster across courses owned by the authenticated teacher.
    """
    return TeacherService.get_students(
        db=db,
        teacher_id=current_user.id,
        page=page,
        page_size=page_size,
        search=search,
        course_id=course_id,
        progress_status=progress_status,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/students/{student_id}", response_model=TeacherStudentDetailResponse)
def get_teacher_student_detail(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    Get detailed progress breakdown for a student enrolled in teacher's courses.
    Returns HTTP 404 if student is not enrolled in any course owned by teacher.
    """
    return TeacherService.get_student_detail(
        db=db, teacher_id=current_user.id, student_id=student_id
    )


@router.get("/analytics", response_model=TeacherAnalyticsResponse)
def get_teacher_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher),
) -> Any:
    """
    Get comprehensive teaching operations analytics for the authenticated teacher.
    """
    return TeacherService.get_analytics(db=db, teacher_id=current_user.id)
