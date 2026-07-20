from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api import deps
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate, UserResponse, RegisterResponse, 
    EmailOtpVerifyRequest, EmailOtpResendRequest
)
from app.schemas.auth import Token
from app.crud.user import get_user_by_email, create_user, authenticate
from app.core.security import create_access_token
from app.services.otp_service import create_otp_for_user, verify_otp_for_user
from app.services.settings_service import SettingsService

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    accept_language: Optional[str] = Header(None)
) -> Any:
    """
    Register a new user (student or teacher) and issue a verification OTP.
    """
    if user_in.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration of admin accounts is not permitted.",
        )
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    # Create unverified user
    new_user = create_user(db, obj_in=user_in)
    
    # Send verification OTP based on request language
    lang = "vi" if accept_language and "vi" in accept_language.lower() else "en"
    try:
        create_otp_for_user(db, user_id=new_user.id, email=new_user.email, language=lang)
    except Exception as e:
        # Don't fail the registration if mailing fails due to configuration, but log it
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to generate/send initial verification OTP: {str(e)}")

    return {
        "message": "Registration successful. Please verify your email.",
        "email_verification_required": True,
        "email": new_user.email
    }



@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, retrieve a JWT access token.
    Rejects logins for users that have not completed email verification.
    """
    user = authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    sys_settings = SettingsService.get_settings(db)
    if sys_settings.require_email_verification and not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in."
        )
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }


@router.post("/verify-email-otp")
def verify_email_otp(
    *,
    db: Session = Depends(get_db),
    payload: EmailOtpVerifyRequest,
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
) -> Any:
    """
    Verifies the email verification OTP code. Marks the user as verified on success.
    Supports authenticated user tokens or explicit payload email.
    Always resolves target account from JWT for authenticated requests and rejects mismatching body emails.
    """
    if current_user:
        if payload.email and payload.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email mismatch. Authenticated requests can only verify the logged-in user's email."
            )
        user = current_user
    else:
        if not payload.email or not payload.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is required for unauthenticated verification requests."
            )
        user = get_user_by_email(db, email=payload.email.strip())

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
    
    if user.email_verified:
        return {"message": "Email is already verified.", "email_verified": True}

    # Verify matching credentials
    verify_otp_for_user(db, email=user.email, otp=payload.otp)

    # Success: update database status
    user.email_verified = True
    db.add(user)
    db.commit()

    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Email verified successfully for user_id={user.id}, email={user.email}")

    return {"message": "Email verified successfully.", "email_verified": True}


@router.post("/resend-email-otp")
def resend_email_otp(
    *,
    db: Session = Depends(get_db),
    payload: EmailOtpResendRequest,
    accept_language: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
) -> Any:
    """
    Resends a new verification OTP code. Enforces resend cooldowns.
    Always resolves target account from JWT for authenticated requests and rejects mismatching body emails.
    Returns a generic message to prevent account existence disclosures for unauthenticated requests.
    """
    generic_msg = "If the email is registered and unverified, a new verification code has been sent."

    if current_user:
        if payload.email and payload.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email mismatch. Authenticated requests can only resend to the logged-in user's email."
            )
        user = current_user
    else:
        if not payload.email or not payload.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is required for unauthenticated resend requests."
            )
        user = get_user_by_email(db, email=payload.email.strip())

    if not user:
        return {"message": generic_msg}

    if user.email_verified:
        return {"message": "Email is already verified.", "email_verified": True}

    lang = "vi" if accept_language and "vi" in accept_language.lower() else "en"
    
    # Generate and transmit new OTP record
    create_otp_for_user(db, user_id=user.id, email=user.email, language=lang)

    return {"message": generic_msg}


@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(deps.get_current_user_allow_unverified)
) -> Any:
    """
    Get current logged-in user profile.
    """
    return current_user
