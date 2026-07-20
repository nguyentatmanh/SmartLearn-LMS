from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.profile import TeacherProfile, TeacherApprovalStatus
from app.services.audit_service import log_audit_event, log_audit_failure


class TeacherApprovalService:
    @staticmethod
    def approve_teacher(
        db: Session,
        teacher_id: int,
        admin_id: int,
        ip_address: Optional[str] = None
    ) -> User:
        teacher = db.query(User).filter(User.id == teacher_id).first()
        if not teacher:
            log_audit_failure(
                event_type="TEACHER_APPROVE",
                target_type="user",
                actor_id=admin_id,
                target_id=str(teacher_id),
                details={"error": "Teacher user not found"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher user not found."
            )

        if teacher.role != UserRole.TEACHER:
            log_audit_failure(
                event_type="TEACHER_APPROVE",
                target_type="user",
                actor_id=admin_id,
                target_id=str(teacher_id),
                details={"error": "User is not a teacher"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a teacher."
            )

        if not teacher.teacher_profile:
            log_audit_failure(
                event_type="TEACHER_APPROVE",
                target_type="user",
                actor_id=admin_id,
                target_id=str(teacher_id),
                details={"error": "Teacher profile missing"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher profile does not exist. Manual profile repair required."
            )

        # Mutate status
        teacher.teacher_profile.approval_status = TeacherApprovalStatus.APPROVED
        teacher.teacher_profile.reviewed_by = admin_id
        teacher.teacher_profile.reviewed_at = datetime.now(timezone.utc)
        teacher.teacher_profile.rejection_reason = None
        teacher.is_approved = True

        db.add(teacher.teacher_profile)
        db.add(teacher)

        log_audit_event(
            db=db,
            event_type="TEACHER_APPROVED",
            target_type="user",
            actor_id=admin_id,
            target_id=str(teacher.id),
            result="success",
            details={"email": teacher.email, "role": teacher.role.value},
            ip_address=ip_address
        )

        db.commit()
        db.refresh(teacher)
        return teacher

    @staticmethod
    def reject_teacher(
        db: Session,
        teacher_id: int,
        admin_id: int,
        rejection_reason: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> User:
        teacher = db.query(User).filter(User.id == teacher_id).first()
        if not teacher:
            log_audit_failure(
                event_type="TEACHER_REJECT",
                target_type="user",
                actor_id=admin_id,
                target_id=str(teacher_id),
                details={"error": "Teacher user not found"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher user not found."
            )

        if teacher.role != UserRole.TEACHER:
            log_audit_failure(
                event_type="TEACHER_REJECT",
                target_type="user",
                actor_id=admin_id,
                target_id=str(teacher_id),
                details={"error": "User is not a teacher"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a teacher."
            )

        if not teacher.teacher_profile:
            log_audit_failure(
                event_type="TEACHER_REJECT",
                target_type="user",
                actor_id=admin_id,
                target_id=str(teacher_id),
                details={"error": "Teacher profile missing"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher profile does not exist."
            )

        # Mutate status
        teacher.teacher_profile.approval_status = TeacherApprovalStatus.REJECTED
        teacher.teacher_profile.reviewed_by = admin_id
        teacher.teacher_profile.reviewed_at = datetime.now(timezone.utc)
        teacher.teacher_profile.rejection_reason = rejection_reason
        teacher.is_approved = False

        db.add(teacher.teacher_profile)
        db.add(teacher)

        log_audit_event(
            db=db,
            event_type="TEACHER_REJECTED",
            target_type="user",
            actor_id=admin_id,
            target_id=str(teacher.id),
            result="success",
            details={"email": teacher.email, "rejection_reason": rejection_reason},
            ip_address=ip_address
        )

        db.commit()
        db.refresh(teacher)
        return teacher
