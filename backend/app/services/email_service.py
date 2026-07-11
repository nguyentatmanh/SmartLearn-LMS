import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp: str, expires_minutes: int = 10, language: str = "en") -> bool:
    """
    Sends a secure 6-digit OTP code to the recipient's email address.
    If SMTP variables are not configured and local settings are set to development,
    falls back to printing to stdout.
    """
    subject = (
        "SmartLearn LMS Email Verification Code"
        if language == "en"
        else "Mã xác nhận địa chỉ email SmartLearn LMS"
    )

    if language == "vi":
        text_content = f"""Xin chào,

Cảm ơn bạn đã đăng ký tài khoản tại SmartLearn LMS.

Mã xác thực của bạn là: {otp}

Mã này có hiệu lực trong vòng {expires_minutes} phút và chỉ có giá trị sử dụng một lần.
Vui lòng KHÔNG chia sẻ mã này với bất kỳ ai để đảm bảo bảo mật tài khoản.

Trân trọng,
Đội ngũ SmartLearn LMS
"""
    else:
        text_content = f"""Hello,

Thank you for registering at SmartLearn LMS.

Your verification code is: {otp}

This code will expire in {expires_minutes} minutes and is valid for single-use only.
Please DO NOT share this code with anyone to maintain account security.

Best regards,
SmartLearn LMS Team
"""

    is_dev = settings.DEBUG or settings.ENVIRONMENT == "development"
    if is_dev:
        print(f"\n[DEVELOPMENT OTP LOG]")
        print("=============================================================")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"BODY:\n{text_content}")
        print("=============================================================\n")

    # Check if SMTP configuration exists
    has_smtp = all([
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        settings.SMTP_USERNAME,
        settings.SMTP_PASSWORD,
        settings.SMTP_FROM_EMAIL
    ])

    if not has_smtp:
        if is_dev:
            return True
        else:
            logger.error("SMTP configuration missing in non-development mode. Cannot send OTP email.")
            return False

    try:
        # Construct email message
        message = MIMEMultipart()
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(text_content, "plain", "utf-8"))

        # Connect to SMTP server
        host = settings.SMTP_HOST
        port = settings.SMTP_PORT or 587
        
        server = smtplib.SMTP(host, port)
        server.ehlo()
        
        if settings.SMTP_USE_TLS:
            server.starttls()
            server.ehlo()
            
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, message.as_string())
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {str(e)}")
        return False
