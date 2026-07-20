from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.setting import SystemSetting
from app.models.user import User, UserRole
from app.services.audit_service import log_audit_event, log_audit_failure


class SettingsService:
    @staticmethod
    def get_settings(db: Session) -> SystemSetting:
        settings = db.query(SystemSetting).filter(SystemSetting.id == 1).first()
        if not settings:
            # Seed default single row if missing during development recovery
            verified_admins_count = (
                db.query(User)
                .filter(
                    User.role == UserRole.ADMIN,
                    User.is_active == True,
                    User.email_verified == True
                )
                .count()
            )
            settings = SystemSetting(
                id=1,
                require_teacher_approval=True,
                require_email_verification=(verified_admins_count > 0),
                require_course_review=False
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    @staticmethod
    def update_settings(
        db: Session,
        update_data: Dict[str, Any],
        admin_id: int,
        ip_address: Optional[str] = None
    ) -> SystemSetting:
        # Lock row id=1
        settings = (
            db.query(SystemSetting)
            .filter(SystemSetting.id == 1)
            .with_for_update()
            .first()
        )
        if not settings:
            settings = SystemSetting(id=1)
            db.add(settings)
            db.flush()

        # Admin Lockout Protection:
        # If enabling require_email_verification, ensure at least 1 active, email_verified admin exists
        new_verify = update_data.get("require_email_verification", settings.require_email_verification)
        if new_verify:
            verified_admins_count = (
                db.query(User)
                .filter(
                    User.role == UserRole.ADMIN,
                    User.is_active == True,
                    User.email_verified == True
                )
                .count()
            )
            if verified_admins_count == 0:
                log_audit_failure(
                    event_type="SYSTEM_SETTINGS_UPDATE",
                    target_type="system_setting",
                    actor_id=admin_id,
                    target_id="1",
                    details={"error": "ADMIN_POLICY_LOCKOUT_RISK"},
                    ip_address=ip_address
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "ADMIN_POLICY_LOCKOUT_RISK",
                        "message": "Cannot enable email verification requirement because zero active, email-verified administrators exist to manage settings."
                    }
                )

        allowed_fields = {"require_teacher_approval", "require_email_verification", "require_course_review"}
        for field, value in update_data.items():
            if field in allowed_fields and isinstance(value, bool):
                setattr(settings, field, value)

        settings.updated_by = admin_id
        db.add(settings)

        log_audit_event(
            db=db,
            event_type="SYSTEM_SETTINGS_UPDATED",
            target_type="system_setting",
            actor_id=admin_id,
            target_id="1",
            result="success",
            details=update_data,
            ip_address=ip_address
        )

        db.commit()
        db.refresh(settings)
        return settings
