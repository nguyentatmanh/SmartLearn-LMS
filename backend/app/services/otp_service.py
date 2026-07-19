import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.otp import EmailVerificationOTP
from app.services.email_service import send_otp_email


def calculate_otp_hash(email: str, otp: str, purpose: str) -> str:
    """
    Computes a secure HMAC-SHA256 hash using the secret key as pepper and
    a stable message structure (email + otp + purpose).
    """
    message = f"{email.lower().strip()}:{otp.strip()}:{purpose}"
    key = settings.SECRET_KEY.encode('utf-8')
    h = hmac.new(key, message.encode('utf-8'), hashlib.sha256)
    return h.hexdigest()


def generate_otp() -> str:
    """Generates a secure 6-digit numeric string."""
    return "".join(secrets.choice("0123456789") for _ in range(6))


def create_otp_for_user(
    db: Session, 
    user_id: int, 
    email: str, 
    purpose: str = "email_verification", 
    language: str = "en"
) -> EmailVerificationOTP:
    """
    Creates a new OTP for the user. Invalidates all previous active OTPs for the user/purpose,
    enforces a 60s resend cooldown, and sends the code to the user's email.
    """
    now = datetime.now(timezone.utc)

    # 1. Check for cooldown violation on previous OTPs
    last_active = db.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user_id,
        EmailVerificationOTP.purpose == purpose
    ).order_by(EmailVerificationOTP.created_at.desc()).first()

    if last_active and last_active.resend_available_at and last_active.resend_available_at > now:
        delta = last_active.resend_available_at - now
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {int(delta.total_seconds())} seconds before requesting a new code."
        )

    # 2. Invalidate all previous unconsumed OTPs for this user and purpose
    db.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user_id,
        EmailVerificationOTP.purpose == purpose,
        EmailVerificationOTP.consumed_at.is_(None)
    ).update({EmailVerificationOTP.consumed_at: now}, synchronize_session=False)

    # 3. Generate new OTP and hash it
    otp = generate_otp()
    otp_hash = calculate_otp_hash(email, otp, purpose)

    # 4. Define lifespan dates
    expires_at = now + timedelta(minutes=10)
    resend_available_at = now + timedelta(seconds=60)

    # 5. Create new OTP record
    db_obj = EmailVerificationOTP(
        user_id=user_id,
        email=email.lower().strip(),
        otp_hash=otp_hash,
        purpose=purpose,
        expires_at=expires_at,
        resend_available_at=resend_available_at,
        created_at=now,
        updated_at=now
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # 6. Send code via Email Service
    sent = send_otp_email(
        to_email=email,
        otp=otp,
        expires_minutes=10,
        language=language
    )

    if not sent:
        db.delete(db_obj)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code. Please check SMTP settings or try again later."
        )

    return db_obj


def verify_otp_for_user(
    db: Session,
    email: str,
    otp: str,
    purpose: str = "email_verification"
) -> bool:
    """
    Verifies the OTP code for a user. Increments attempt counts on failure, checks expiration,
    consumes code on match, and raises appropriate HTTPExceptions.
    """
    now = datetime.now(timezone.utc)
    email_clean = email.lower().strip()

    # 1. Fetch latest OTP record for this email
    record = db.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.email == email_clean,
        EmailVerificationOTP.purpose == purpose
    ).order_by(EmailVerificationOTP.created_at.desc()).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found for this email address."
        )

    # 2. Enforce verification rules
    if record.consumed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification code has already been used."
        )

    if record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification code has expired. Please request a new one."
        )

    if record.attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. This code is locked. Please request a new code."
        )

    # 3. Secure constant-time comparison
    computed_hash = calculate_otp_hash(email_clean, otp, purpose)
    
    if hmac.compare_digest(record.otp_hash, computed_hash):
        # Match found: mark consumed
        record.consumed_at = now
        db.add(record)
        db.commit()
        return True
    else:
        # Invalid OTP: increment attempt counter
        record.attempts += 1
        db.add(record)
        db.commit()
        
        remaining = 5 - record.attempts
        if remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect code. Too many incorrect attempts. This code is now locked. Please request a new code."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incorrect verification code. {remaining} attempts remaining."
            )
