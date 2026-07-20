import csv
import io
from datetime import datetime, date, timedelta, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.api import deps
from app.models.user import User, UserRole
from app.models.profile import TeacherProfile, TeacherApprovalStatus
from app.models.course import Course, CourseStatus, CourseReviewStatus
from app.models.audit import AuditLog
from app.models.setting import SystemSetting
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.schemas.user import (
    UserResponse, UserDetailResponse, DiscriminatedUserProfile,
    StudentProfileSummary, TeacherProfileDetail, AdminProfileSummary, UserActivityItem
)
from app.schemas.course import AdminCourseResponse, CourseStatusPatchRequest, CourseReviewRequestNotes
from app.schemas.audit import AuditLogResponse
from app.schemas.setting import SystemSettingResponse, SystemSettingUpdate
from app.services.teacher_approval import TeacherApprovalService
from app.services.admin_user_service import AdminUserService
from app.services.course_moderation import CourseModerationService
from app.services.settings_service import SettingsService

router = APIRouter()


@router.get("/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Overview metrics, priority attention items, and recent audit logs.
    Bounded aggregate SQL queries only.
    """
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    students_count = db.query(func.count(User.id)).filter(User.role == UserRole.STUDENT).scalar() or 0
    teachers_count = db.query(func.count(User.id)).filter(User.role == UserRole.TEACHER).scalar() or 0
    admins_count = db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar() or 0
    unverified_count = db.query(func.count(User.id)).filter(User.email_verified == False).scalar() or 0

    published_courses = db.query(func.count(Course.id)).filter(Course.status == CourseStatus.PUBLISHED).scalar() or 0
    draft_courses = db.query(func.count(Course.id)).filter(Course.status == CourseStatus.DRAFT).scalar() or 0
    archived_courses = db.query(func.count(Course.id)).filter(Course.status == CourseStatus.ARCHIVED).scalar() or 0
    pending_course_reviews = db.query(func.count(Course.id)).filter(Course.review_status == CourseReviewStatus.PENDING).scalar() or 0

    pending_teachers_count = (
        db.query(func.count(TeacherProfile.id))
        .join(User, TeacherProfile.user_id == User.id)
        .filter(User.role == UserRole.TEACHER, TeacherProfile.approval_status == TeacherApprovalStatus.PENDING)
        .scalar() or 0
    )

    orphan_teachers_count = (
        db.query(func.count(User.id))
        .outerjoin(TeacherProfile, User.id == TeacherProfile.user_id)
        .filter(User.role == UserRole.TEACHER, TeacherProfile.id == None)
        .scalar() or 0
    )

    attention_items = []
    if pending_teachers_count > 0:
        attention_items.append({
            "id": "pending_teachers",
            "type": "teacher_approval",
            "severity": "high",
            "title": f"{pending_teachers_count} teacher application(s) awaiting review",
            "count": pending_teachers_count,
            "action_tab": "teacher-approvals"
        })
    if pending_course_reviews > 0:
        attention_items.append({
            "id": "pending_courses",
            "type": "course_review",
            "severity": "medium",
            "title": f"{pending_course_reviews} course(s) pending administrator publication review",
            "count": pending_course_reviews,
            "action_tab": "courses"
        })
    if orphan_teachers_count > 0:
        attention_items.append({
            "id": "orphan_teachers",
            "type": "profile_repair",
            "severity": "high",
            "title": f"{orphan_teachers_count} teacher account(s) missing profile records",
            "count": orphan_teachers_count,
            "action_tab": "users"
        })

    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "metrics": {
            "total_users": total_users,
            "active_users": active_users,
            "students": students_count,
            "teachers": teachers_count,
            "admins": admins_count,
            "unverified_users": unverified_count,
            "published_courses": published_courses,
            "draft_courses": draft_courses,
            "archived_courses": archived_courses,
            "pending_course_reviews": pending_course_reviews,
            "pending_teacher_requests": pending_teachers_count,
            "orphan_teachers": orphan_teachers_count
        },
        "attention_items": attention_items,
        "recent_audit_logs": [AuditLogResponse.model_validate(log) for log in recent_logs]
    }


@router.get("/users")
def get_users_list(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    email_verified: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> Any:
    query = db.query(User).options(
        selectinload(User.profile),
        selectinload(User.teacher_profile)
    )

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).like(term),
                func.lower(User.email).like(term)
            )
        )
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if email_verified is not None:
        query = query.filter(User.email_verified == email_verified)

    total = query.count()
    items = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [UserResponse.model_validate(u) for u in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/users/{user_id}", response_model=UserDetailResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    user = (
        db.query(User)
        .options(
            selectinload(User.profile),
            selectinload(User.teacher_profile).selectinload(TeacherProfile.reviewer)
        )
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    # 1. Basic Profile values
    phone_number = user.profile.phone_number if user.profile else None
    date_of_birth = user.profile.date_of_birth if user.profile else None

    # 2. Last Login At (from AuditLog)
    last_login_log = (
        db.query(AuditLog)
        .filter(
            AuditLog.actor_id == user_id,
            or_(
                func.lower(AuditLog.event_type).like("%login%"),
                func.lower(AuditLog.event_type) == "user_login"
            )
        )
        .order_by(AuditLog.created_at.desc())
        .first()
    )
    last_login_at = last_login_log.created_at if last_login_log else None

    # 3. Role-discriminated profile details
    discriminated_profile: Optional[DiscriminatedUserProfile] = None

    if user.role == UserRole.STUDENT:
        enrolled_count = db.query(func.count(Enrollment.id)).filter(Enrollment.student_id == user_id).scalar() or 0
        completed_count = db.query(func.count(Enrollment.id)).filter(Enrollment.student_id == user_id, Enrollment.completed_at.isnot(None)).scalar() or 0
        active_count = db.query(func.count(Enrollment.id)).filter(Enrollment.student_id == user_id, Enrollment.completed_at.is_(None)).scalar() or 0
        completed_lessons = db.query(func.count(LessonProgress.id)).filter(LessonProgress.student_id == user_id, LessonProgress.is_completed == True).scalar() or 0

        discriminated_profile = DiscriminatedUserProfile(
            type="student",
            student_details=StudentProfileSummary(
                enrolled_courses_count=enrolled_count,
                active_courses_count=active_count,
                completed_courses_count=completed_count,
                completed_lessons_count=completed_lessons
            )
        )

    elif user.role == UserRole.TEACHER:
        tp = user.teacher_profile
        if tp:
            total_courses = db.query(func.count(Course.id)).filter(Course.teacher_id == user_id).scalar() or 0
            published_courses = db.query(func.count(Course.id)).filter(Course.teacher_id == user_id, Course.status == CourseStatus.PUBLISHED).scalar() or 0
            total_students = (
                db.query(func.count(func.distinct(Enrollment.student_id)))
                .join(Course, Enrollment.course_id == Course.id)
                .filter(Course.teacher_id == user_id)
                .scalar() or 0
            )

            reviewer_name = tp.reviewer.full_name if tp.reviewer else None

            discriminated_profile = DiscriminatedUserProfile(
                type="teacher",
                teacher_details=TeacherProfileDetail(
                    faculty=tp.faculty,
                    department=tp.department,
                    specialization=tp.specialization,
                    academic_title=tp.academic_title,
                    teacher_code=tp.teacher_code,
                    bio=tp.bio,
                    approval_status=tp.approval_status,
                    rejection_reason=tp.rejection_reason,
                    reviewed_at=tp.reviewed_at,
                    reviewed_by=tp.reviewed_by,
                    reviewer_name=reviewer_name,
                    total_courses=total_courses,
                    published_courses=published_courses,
                    total_students=total_students
                )
            )

    elif user.role == UserRole.ADMIN:
        discriminated_profile = DiscriminatedUserProfile(
            type="admin",
            admin_details=AdminProfileSummary(
                admin_level="System Administrator"
            )
        )

    # 4. Recent Activity (last 10 logs affecting this user OR performed by this user)
    activity_logs = (
        db.query(AuditLog)
        .filter(
            or_(
                and_(
                    func.lower(AuditLog.target_type) == "user",
                    AuditLog.target_id == str(user_id)
                ),
                AuditLog.actor_id == user_id
            )
        )
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )

    activities: List[UserActivityItem] = []
    for log in activity_logs:
        is_target = (log.target_type and log.target_type.lower() == "user" and log.target_id == str(user_id))
        category = "target" if is_target else "actor"

        if category == "target":
            desc = f"Account event: {log.event_type.replace('_', ' ').title()}"
        else:
            desc = f"Action performed: {log.event_type.replace('_', ' ').title()}"
            if log.target_type:
                desc += f" ({log.target_type} #{log.target_id or ''})".strip()

        activities.append(
            UserActivityItem(
                id=log.id,
                event_type=log.event_type,
                result=log.result,
                created_at=log.created_at,
                ip_address=log.ip_address,
                description=desc,
                activity_category=category
            )
        )

    return UserDetailResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        email_verified=user.email_verified,
        is_approved=user.is_approved,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=last_login_at,
        phone_number=phone_number,
        date_of_birth=date_of_birth,
        profile=discriminated_profile,
        recent_activities=activities
    )


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    new_role_str = payload.get("role")
    if not new_role_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role parameter is required.")
    try:
        new_role = UserRole(new_role_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {new_role_str}")

    ip_address = request.client.host if request.client else None
    user = AdminUserService.update_user_role(db, user_id, new_role, current_admin.id, ip_address)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/active")
def toggle_user_active(
    user_id: int,
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    is_active = payload.get("is_active")
    if is_active is None or not isinstance(is_active, bool):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="is_active boolean parameter is required.")

    ip_address = request.client.host if request.client else None
    user = AdminUserService.toggle_user_active(db, user_id, is_active, current_admin.id, ip_address)
    return UserResponse.model_validate(user)


@router.get("/teacher-requests")
def get_teacher_requests(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> Any:
    query = (
        db.query(User)
        .options(selectinload(User.teacher_profile))
        .join(TeacherProfile, User.id == TeacherProfile.user_id)
        .filter(User.role == UserRole.TEACHER, TeacherProfile.approval_status == TeacherApprovalStatus.PENDING)
    )
    total = query.count()
    items = query.order_by(TeacherProfile.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [UserResponse.model_validate(u) for u in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("/teachers/{teacher_id}/approve")
def approve_teacher(
    teacher_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    ip = request.client.host if request.client else None
    user = TeacherApprovalService.approve_teacher(db, teacher_id, current_admin.id, ip)
    return UserResponse.model_validate(user)


@router.post("/teachers/{teacher_id}/reject")
def reject_teacher(
    teacher_id: int,
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    reason = payload.get("rejection_reason")
    ip = request.client.host if request.client else None
    user = TeacherApprovalService.reject_teacher(db, teacher_id, current_admin.id, reason, ip)
    return UserResponse.model_validate(user)


@router.get("/courses")
def get_admin_courses(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    q: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    review_status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> Any:
    query = db.query(Course).options(
        selectinload(Course.teacher),
        selectinload(Course.chapters),
        selectinload(Course.lessons),
        selectinload(Course.enrollments)
    )

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(func.lower(Course.title).like(term))
    if status_filter:
        query = query.filter(Course.status == status_filter)
    if review_status:
        query = query.filter(Course.review_status == review_status)

    total = query.count()
    items = query.order_by(Course.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [AdminCourseResponse.model_validate(c) for c in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("/courses/{course_id}/approve-review")
def approve_course_review(
    course_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    ip = request.client.host if request.client else None
    course = CourseModerationService.approve_review(db, course_id, current_admin.id, ip)
    return AdminCourseResponse.model_validate(course)


@router.post("/courses/{course_id}/request-changes")
def request_course_changes(
    course_id: int,
    payload: CourseReviewRequestNotes,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    ip = request.client.host if request.client else None
    course = CourseModerationService.request_changes(db, course_id, current_admin.id, payload.review_note, ip)
    return AdminCourseResponse.model_validate(course)


@router.patch("/courses/{course_id}/status")
def patch_course_status(
    course_id: int,
    payload: CourseStatusPatchRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    ip = request.client.host if request.client else None
    course = CourseModerationService.update_course_status(db, course_id, payload.status, current_admin, ip)
    return AdminCourseResponse.model_validate(course)


@router.get("/settings", response_model=SystemSettingResponse)
def get_system_settings(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    return SettingsService.get_settings(db)


@router.patch("/settings", response_model=SystemSettingResponse)
def update_system_settings(
    payload: SystemSettingUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    ip = request.client.host if request.client else None
    update_dict = payload.model_dump(exclude_unset=True)
    return SettingsService.update_settings(db, update_dict, current_admin.id, ip)


@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    event_type: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> Any:
    query = db.query(AuditLog)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    if result:
        query = query.filter(AuditLog.result == result)

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": [AuditLogResponse.model_validate(log) for log in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/search")
def global_admin_search(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    q: str = Query(..., description="Query string"),
    types: str = Query("user,course,teacher_request"),
    limit: int = Query(10, ge=1, le=20)
) -> Any:
    clean_q = q.strip().lower()
    if len(clean_q) < 2 or len(clean_q) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string must be between 2 and 100 characters."
        )

    requested_types = [t.strip().lower() for t in types.split(",") if t.strip()]
    allowed_types = {"user", "course", "teacher_request"}
    valid_types = [t for t in requested_types if t in allowed_types]

    result = {"users": [], "courses": [], "teacher_requests": []}
    term = f"%{clean_q}%"

    if "user" in valid_types:
        users = (
            db.query(User)
            .filter(or_(func.lower(User.full_name).like(term), func.lower(User.email).like(term)))
            .limit(limit)
            .all()
        )
        result["users"] = [{"id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role.value, "is_active": u.is_active} for u in users]

    if "course" in valid_types:
        courses = (
            db.query(Course)
            .filter(func.lower(Course.title).like(term))
            .limit(limit)
            .all()
        )
        result["courses"] = [{"id": c.id, "title": c.title, "status": c.status.value, "review_status": c.review_status.value} for c in courses]

    if "teacher_request" in valid_types:
        requests = (
            db.query(User)
            .join(TeacherProfile, User.id == TeacherProfile.user_id)
            .filter(
                User.role == UserRole.TEACHER,
                TeacherProfile.approval_status == TeacherApprovalStatus.PENDING,
                or_(func.lower(User.full_name).like(term), func.lower(User.email).like(term))
            )
            .limit(limit)
            .all()
        )
        result["teacher_requests"] = [{"id": r.id, "full_name": r.full_name, "email": r.email, "faculty": r.teacher_profile.faculty if r.teacher_profile else None} for r in requests]

    return result


@router.get("/reports")
def get_admin_reports(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    granularity: str = Query("day")
) -> Any:
    end_date = date_to or date.today()
    start_date = date_from or (end_date - timedelta(days=30))

    if (end_date - start_date).days > 365:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum report date range is 365 days.")

    new_users_count = (
        db.query(func.count(User.id))
        .filter(User.created_at >= start_date, User.created_at <= end_date + timedelta(days=1))
        .scalar() or 0
    )
    new_courses_count = (
        db.query(func.count(Course.id))
        .filter(Course.created_at >= start_date, Course.created_at <= end_date + timedelta(days=1))
        .scalar() or 0
    )

    return {
        "date_from": start_date.isoformat(),
        "date_to": end_date.isoformat(),
        "granularity": granularity,
        "metrics": {
            "new_users": new_users_count,
            "new_courses": new_courses_count
        }
    }


@router.get("/reports/export")
def export_admin_report_csv(
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    granularity: str = Query("day")
) -> Any:
    end_date = date_to or date.today()
    start_date = date_from or (end_date - timedelta(days=30))

    if (end_date - start_date).days > 365:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum report date range is 365 days.")

    users = (
        db.query(User)
        .filter(User.created_at >= start_date, User.created_at <= end_date + timedelta(days=1))
        .all()
    )

    output = io.StringIO()
    # Write UTF-8 BOM
    output.write("\ufeff")
    writer = csv.writer(output)
    writer.writerow(["User ID", "Full Name", "Email", "Role", "Is Active", "Email Verified", "Created At"])

    def sanitize_cell(val: Any) -> str:
        s = str(val) if val is not None else ""
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return f"'{s}"
        return s

    for u in users:
        writer.writerow([
            sanitize_cell(u.id),
            sanitize_cell(u.full_name),
            sanitize_cell(u.email),
            sanitize_cell(u.role.value),
            sanitize_cell(u.is_active),
            sanitize_cell(u.email_verified),
            sanitize_cell(u.created_at.isoformat() if u.created_at else "")
        ])

    output.seek(0)
    filename = f"smartlearn_admin_report_{granularity}_{start_date}_to_{end_date}.csv"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(io.BytesIO(output.getvalue().encode("utf-8")), media_type="text/csv", headers=headers)
