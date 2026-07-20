import json
import logging
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.audit import AuditLog

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {
    "password", "hashed_password", "otp", "token", 
    "access_token", "secret", "authorization", "secret_key"
}


def sanitize_details(details: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not details:
        return None
    
    def _clean(val: Any) -> Any:
        if isinstance(val, dict):
            cleaned_dict = {}
            for k, v in val.items():
                if k.lower() in SENSITIVE_KEYS:
                    cleaned_dict[k] = "[REDACTED]"
                else:
                    cleaned_dict[k] = _clean(v)
            return cleaned_dict
        elif isinstance(val, list):
            return [_clean(item) for item in val]
        return val

    try:
        sanitized = _clean(details)
        serialized = json.dumps(sanitized)
        # Cap size at 10 KB
        if len(serialized) > 10240:
            return {"_warning": "Payload size truncated (>10KB)"}
        return sanitized
    except Exception as e:
        logger.error(f"Error sanitizing audit log details: {e}")
        return {"_error": "Failed to sanitize payload"}


def log_audit_event(
    db: Session,
    event_type: str,
    target_type: str,
    actor_id: Optional[int],
    target_id: Optional[str] = None,
    result: str = "success",
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Log an audit event within the active transaction.
    """
    sanitized = sanitize_details(details)
    audit_entry = AuditLog(
        event_type=event_type,
        actor_id=actor_id,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        result=result,
        sanitized_details=sanitized,
        request_id=request_id,
        ip_address=ip_address
    )
    db.add(audit_entry)
    return audit_entry


def log_audit_failure(
    event_type: str,
    target_type: str,
    actor_id: Optional[int],
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> None:
    """
    Log a failure audit event in a fresh isolated database transaction.
    """
    isolated_db = SessionLocal()
    try:
        log_audit_event(
            db=isolated_db,
            event_type=event_type,
            target_type=target_type,
            actor_id=actor_id,
            target_id=target_id,
            result="failure",
            details=details,
            request_id=request_id,
            ip_address=ip_address
        )
        isolated_db.commit()
    except Exception as e:
        logger.error(f"Failed to record failure audit event: {e}")
        isolated_db.rollback()
    finally:
        isolated_db.close()
