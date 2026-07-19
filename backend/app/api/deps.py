from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM
from app.schemas.auth import TokenPayload
from app.models.user import User, UserRole
from app.crud.user import get_user

# OAuth2PasswordBearer extracts the Bearer token from the Authorization header.
# We point tokenUrl to the login endpoint.
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
    current_user: User = Depends(get_current_user_allow_unverified),
) -> User:
    """
    Validates token and enforces that the user's email is verified.
    """
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified."
        )
    return current_user


from typing import Optional
from fastapi import Header

def get_current_user_optional(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
) -> Optional[User]:
    """
    Optionally retrieves the current active user if a valid Authorization Bearer header is present.
    Returns None if missing or invalid.
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


from app.models.profile import TeacherApprovalStatus


def get_current_active_teacher(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Enforce that the current user has the Teacher role and is approved by administrators.
    """
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges (Teacher role required)",
        )
    if not current_user.teacher_profile or current_user.teacher_profile.approval_status != TeacherApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher account is pending administrator approval.",
        )
    return current_user


def get_current_active_student(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Enforce that the current user has the Student role.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges (Student role required)",
        )
    return current_user


def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Enforce that the current user has the Admin role.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges (Admin role required)",
        )
    return current_user
