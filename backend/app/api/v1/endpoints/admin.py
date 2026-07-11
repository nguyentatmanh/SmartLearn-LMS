from typing import Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.core.database import get_db
from app.api import deps
from app.models.user import User, UserRole
from app.models.profile import TeacherProfile, UserProfile, TeacherApprovalStatus
from app.models.course import Course, CourseStatus
from app.models.enrollment import Enrollment
from app.schemas.user import (
    UserResponse, 
    TeacherRejectRequest, 
    UserActiveToggleRequest,
    UserRolePatchRequest,
    AdminUserResponse
)
from app.schemas.course import (
    AdminCourseResponse,
    CourseStatusPatchRequest,
    CourseDetailResponse
)

router = APIRouter()


def serialize_user(user: User) -> dict:
    profile_data = None
    if user.profile:
        profile_data = {
            "full_name": user.profile.full_name,
            "phone_number": user.profile.phone_number,
            "date_of_birth": user.profile.date_of_birth
        }
        
    teacher_profile_data = None
    if user.teacher_profile:
        teacher_profile_data = {
            "faculty": user.teacher_profile.faculty,
            "department": user.teacher_profile.department,
            "specialization": user.teacher_profile.specialization,
            "academic_title": user.teacher_profile.academic_title,
            "teacher_code": user.teacher_profile.teacher_code,
            "bio": user.teacher_profile.bio,
            "approval_status": user.teacher_profile.approval_status.value if hasattr(user.teacher_profile.approval_status, "value") else user.teacher_profile.approval_status,
            "rejection_reason": user.teacher_profile.rejection_reason
        }
        
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "email_verified": user.email_verified,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "profile": profile_data,
        "teacher_profile": teacher_profile_data,
        "enrolled_courses_count": len(user.enrollments) if user.role == UserRole.STUDENT else 0,
        "created_courses_count": len(user.courses) if user.role == UserRole.TEACHER else 0
    }


@router.get("/users", response_model=List[AdminUserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    List all users with profile, teacher status, and course counts. Only for administrators.
    """
    users = (
        db.query(User)
        .options(
            selectinload(User.profile),
            selectinload(User.teacher_profile),
            selectinload(User.courses),
            selectinload(User.enrollments)
        )
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [serialize_user(u) for u in users]



@router.get("/users/{user_id}", response_model=AdminUserResponse)
def read_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Retrieve single user details with profile and course counts. Only for admins.
    """
    user = (
        db.query(User)
        .options(
            selectinload(User.profile),
            selectinload(User.teacher_profile),
            selectinload(User.courses),
            selectinload(User.enrollments)
        )
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    return serialize_user(user)


@router.get("/teacher-requests", response_model=List[UserResponse])
def read_pending_teachers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    List all pending teacher approval requests.
    """
    users = (
        db.query(User)
        .join(TeacherProfile, User.id == TeacherProfile.user_id)
        .options(
            selectinload(User.profile),
            selectinload(User.teacher_profile)
        )
        .filter(User.role == UserRole.TEACHER)
        .filter(TeacherProfile.approval_status == TeacherApprovalStatus.PENDING)
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return users


@router.post("/teachers/{teacher_id}/approve", response_model=UserResponse)
def approve_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Approve a pending teacher registration.
    """
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher user not found."
        )
    if teacher.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a teacher."
        )
    
    if not teacher.teacher_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher profile does not exist."
        )

    # Approve
    teacher.teacher_profile.approval_status = TeacherApprovalStatus.APPROVED
    teacher.teacher_profile.reviewed_by = current_admin.id
    teacher.teacher_profile.reviewed_at = datetime.now(timezone.utc)
    teacher.teacher_profile.rejection_reason = None
    teacher.is_approved = True  # Sync legacy flag

    db.add(teacher.teacher_profile)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.post("/teachers/{teacher_id}/reject", response_model=UserResponse)
def reject_teacher(
    teacher_id: int,
    reject_in: TeacherRejectRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Reject a pending teacher registration with an optional reason.
    """
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher user not found."
        )
    if teacher.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a teacher."
        )
    
    if not teacher.teacher_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher profile does not exist."
        )

    # Reject
    teacher.teacher_profile.approval_status = TeacherApprovalStatus.REJECTED
    teacher.teacher_profile.reviewed_by = current_admin.id
    teacher.teacher_profile.reviewed_at = datetime.now(timezone.utc)
    teacher.teacher_profile.rejection_reason = reject_in.rejection_reason
    teacher.is_approved = False  # Sync legacy flag

    db.add(teacher.teacher_profile)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: int,
    role_in: UserRolePatchRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Safely modify user roles. Only admins can execute this.
    """
    user = (
        db.query(User)
        .options(
            selectinload(User.profile),
            selectinload(User.teacher_profile),
            selectinload(User.courses),
            selectinload(User.enrollments)
        )
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    # Check if demoting this admin user would leave 0 active admins
    if user.role == UserRole.ADMIN and role_in.role != UserRole.ADMIN:
        active_admins_count = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
        if active_admins_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last active administrator."
            )

    user.role = role_in.role
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return serialize_user(user)


@router.patch("/users/{user_id}/active", response_model=AdminUserResponse)
def toggle_user_active(
    user_id: int,
    active_in: UserActiveToggleRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Deactivate or activate a user account.
    """
    user = (
        db.query(User)
        .options(
            selectinload(User.profile),
            selectinload(User.teacher_profile),
            selectinload(User.courses),
            selectinload(User.enrollments)
        )
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Check if deactivating this admin user would leave 0 active admins
    if user.role == UserRole.ADMIN and not active_in.is_active:
        active_admins_count = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
        if active_admins_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last active administrator."
            )

    user.is_active = active_in.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return serialize_user(user)


@router.get("/courses", response_model=List[AdminCourseResponse])
def read_admin_courses(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    List all courses. Only for admins.
    """
    courses = (
        db.query(Course)
        .options(
            selectinload(Course.lessons),
            selectinload(Course.enrollments),
            selectinload(Course.teacher)
        )
        .order_by(Course.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for c in courses:
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "thumbnail_url": c.thumbnail_url,
            "status": c.status,
            "teacher_id": c.teacher_id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "teacher": {
                "id": c.teacher.id,
                "full_name": c.teacher.full_name,
                "email": c.teacher.email
            },
            "lessons_count": len(c.lessons),
            "enrollments_count": len(c.enrollments)
        })
    return result


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
def read_admin_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Retrieve single course details. Only for admins.
    """
    course = (
        db.query(Course)
        .options(
            selectinload(Course.teacher),
            selectinload(Course.chapters),
            selectinload(Course.lessons)
        )
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found."
        )
    return course


@router.patch("/courses/{course_id}/status", response_model=AdminCourseResponse)
def update_admin_course_status(
    course_id: int,
    status_in: CourseStatusPatchRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Modify course status (draft / published / archived). Only for admins.
    """
    course = (
        db.query(Course)
        .options(
            selectinload(Course.lessons),
            selectinload(Course.enrollments),
            selectinload(Course.teacher)
        )
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found."
        )
    
    course.status = status_in.status
    db.add(course)
    db.commit()
    db.refresh(course)
    
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "thumbnail_url": course.thumbnail_url,
        "status": course.status,
        "teacher_id": course.teacher_id,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "teacher": {
            "id": course.teacher.id,
            "full_name": course.teacher.full_name,
            "email": course.teacher.email
        },
        "lessons_count": len(course.lessons),
        "enrollments_count": len(course.enrollments)
    }


@router.delete("/courses/{course_id}", response_model=AdminCourseResponse)
def delete_admin_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Delete a course. Only for admins.
    """
    course = (
        db.query(Course)
        .options(
            selectinload(Course.lessons),
            selectinload(Course.enrollments),
            selectinload(Course.teacher)
        )
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found."
        )
    
    resp_obj = {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "thumbnail_url": course.thumbnail_url,
        "status": course.status,
        "teacher_id": course.teacher_id,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "teacher": {
            "id": course.teacher.id,
            "full_name": course.teacher.full_name,
            "email": course.teacher.email
        },
        "lessons_count": len(course.lessons),
        "enrollments_count": len(course.enrollments)
    }
    
    db.delete(course)
    db.commit()
    return resp_obj
