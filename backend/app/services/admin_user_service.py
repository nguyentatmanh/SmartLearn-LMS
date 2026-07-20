from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.models.user import User, UserRole
from app.services.audit_service import log_audit_event, log_audit_failure


class AdminUserService:
    @staticmethod
    def update_user_role(
        db: Session,
        target_user_id: int,
        new_role: UserRole,
        admin_id: int,
        ip_address: Optional[str] = None
    ) -> User:
        # Lock target user and active admins
        target_user = (
            db.query(User)
            .options(
                selectinload(User.profile),
                selectinload(User.teacher_profile),
                selectinload(User.courses),
                selectinload(User.enrollments)
            )
            .filter(User.id == target_user_id)
            .with_for_update()
            .first()
        )

        if not target_user:
            log_audit_failure(
                event_type="USER_ROLE_UPDATE",
                target_type="user",
                actor_id=admin_id,
                target_id=str(target_user_id),
                details={"error": "User not found"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        if target_user.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
            active_admins_count = (
                db.query(User)
                .filter(User.role == UserRole.ADMIN, User.is_active == True)
                .with_for_update()
                .count()
            )
            if active_admins_count <= 1:
                log_audit_failure(
                    event_type="USER_ROLE_UPDATE",
                    target_type="user",
                    actor_id=admin_id,
                    target_id=str(target_user_id),
                    details={"error": "LAST_ADMIN_PROTECTED"},
                    ip_address=ip_address
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "LAST_ADMIN_PROTECTED",
                        "message": "Cannot demote the last active administrator."
                    }
                )

        old_role = target_user.role
        target_user.role = new_role
        db.add(target_user)

        log_audit_event(
            db=db,
            event_type="USER_ROLE_CHANGED",
            target_type="user",
            actor_id=admin_id,
            target_id=str(target_user.id),
            result="success",
            details={"old_role": old_role.value if hasattr(old_role, "value") else old_role, "new_role": new_role.value},
            ip_address=ip_address
        )

        db.commit()
        db.refresh(target_user)
        return target_user

    @staticmethod
    def toggle_user_active(
        db: Session,
        target_user_id: int,
        is_active: bool,
        admin_id: int,
        ip_address: Optional[str] = None
    ) -> User:
        target_user = (
            db.query(User)
            .options(
                selectinload(User.profile),
                selectinload(User.teacher_profile),
                selectinload(User.courses),
                selectinload(User.enrollments)
            )
            .filter(User.id == target_user_id)
            .with_for_update()
            .first()
        )

        if not target_user:
            log_audit_failure(
                event_type="USER_ACTIVE_TOGGLE",
                target_type="user",
                actor_id=admin_id,
                target_id=str(target_user_id),
                details={"error": "User not found"},
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        if target_user.role == UserRole.ADMIN and not is_active:
            active_admins_count = (
                db.query(User)
                .filter(User.role == UserRole.ADMIN, User.is_active == True)
                .with_for_update()
                .count()
            )
            if active_admins_count <= 1:
                log_audit_failure(
                    event_type="USER_ACTIVE_TOGGLE",
                    target_type="user",
                    actor_id=admin_id,
                    target_id=str(target_user_id),
                    details={"error": "LAST_ADMIN_PROTECTED"},
                    ip_address=ip_address
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "LAST_ADMIN_PROTECTED",
                        "message": "Cannot deactivate the last active administrator."
                    }
                )

        target_user.is_active = is_active
        db.add(target_user)

        log_audit_event(
            db=db,
            event_type="USER_ACTIVE_TOGGLED",
            target_type="user",
            actor_id=admin_id,
            target_id=str(target_user.id),
            result="success",
            details={"is_active": is_active},
            ip_address=ip_address
        )

        db.commit()
        db.refresh(target_user)
        return target_user
