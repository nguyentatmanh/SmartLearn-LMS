from typing import Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api import deps
from app.models.user import User, UserRole
from app.models.profile import TeacherProfile, UserProfile, TeacherApprovalStatus
from app.schemas.user import (
    UserResponse, 
    TeacherRejectRequest, 
    UserActiveToggleRequest,
    UserRolePatchRequest
)

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    List all users with profile and teacher status. Only for administrators.
    """
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


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


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_in: UserRolePatchRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Safely modify user roles. Only admins can execute this.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    # Check de-admin safety
    if user.id == current_admin.id and role_in.role != UserRole.ADMIN:
        other_active_admins = (
            db.query(User)
            .filter(User.role == UserRole.ADMIN, User.is_active == True, User.id != current_admin.id)
            .count()
        )
        if other_active_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role of the only active administrator."
            )

    user.role = role_in.role
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/active", response_model=UserResponse)
def toggle_user_active(
    user_id: int,
    active_in: UserActiveToggleRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Deactivate or activate a user account.
    Prevents self-deactivation if they are the last active admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Self deactivation check
    if user.id == current_admin.id and not active_in.is_active:
        other_active_admins = (
            db.query(User)
            .filter(User.role == UserRole.ADMIN, User.is_active == True, User.id != current_admin.id)
            .count()
        )
        if other_active_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the only active administrator."
            )

    user.is_active = active_in.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
