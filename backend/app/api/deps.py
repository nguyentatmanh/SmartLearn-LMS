from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM
from app.schemas.auth import TokenPayload
from app.models.user import User, UserRole
from app.models.profile import TeacherApprovalStatus
from app.crud.user import get_user
from app.services.settings_service import SettingsService

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user_allow_unverified(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Validate JWT token and return active user regardless of email_verified state.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        token_payload = TokenPayload(sub=user_id_str)
    except JWTError:
        raise credentials_exception
        
    try:
        user_id = int(token_payload.sub)
    except ValueError:
        raise credentials_exception
        
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Inactive user"
        )
    return user


def get_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_allow_unverified),
) -> User:
    """
    Validates token and enforces email verification based on SystemSettings policy.
    """
    sys_settings = SettingsService.get_settings(db)
    if sys_settings.require_email_verification and not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified."
        )
    return current_user


def get_current_user_optional(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
) -> Optional[User]:
    """
    Optionally retrieves current active user if Bearer token present.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user = get_user(db, user_id=int(user_id_str))
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None


def get_current_active_teacher(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Enforce Teacher role and approval policy.
    Rejected teachers are ALWAYS BLOCKED.
    Pending teachers are blocked only when require_teacher_approval is True.
    """
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges (Teacher role required)",
        )

    sys_settings = SettingsService.get_settings(db)
    profile = current_user.teacher_profile

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher profile does not exist. Manual profile repair required."
        )

    if profile.approval_status == TeacherApprovalStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher account application was rejected."
        )

    if profile.approval_status == TeacherApprovalStatus.PENDING and sys_settings.require_teacher_approval:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher account is pending administrator approval."
        )

    return current_user


def get_current_active_student(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges (Student role required)",
        )
    return current_user


def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges (Admin role required)",
        )
    return current_user
