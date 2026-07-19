import os
import sys
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

# Add the parent directory of backend/app to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.profile import UserProfile, TeacherProfile, TeacherApprovalStatus
from app.core.security import get_password_hash


def seed_or_reset_user(email: str, password: str, role: str = "student", full_name: str = "Test User"):
    db: Session = SessionLocal()
    clean_email = email.strip().lower()
    user_role = UserRole(role.lower())
    
    try:
        user = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if user:
            print(f"User '{clean_email}' exists. Resetting password and activating account...")
            user.hashed_password = get_password_hash(password)
            user.is_active = True
            user.email_verified = True
            user.is_approved = True
        else:
            print(f"Creating new verified user '{clean_email}'...")
            user = User(
                email=clean_email,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role=user_role,
                is_active=True,
                email_verified=True,
                is_approved=True
            )
            db.add(user)
            db.flush()

            # Create User Profile
            profile = UserProfile(
                user_id=user.id,
                full_name=full_name,
                phone_number="0912345678",
                date_of_birth=date(2000, 1, 1)
            )
            db.add(profile)

            # If teacher, create approved teacher profile
            if user_role == UserRole.TEACHER:
                teacher_profile = TeacherProfile(
                    user_id=user.id,
                    faculty="Computer Science",
                    department="Software Engineering",
                    specialization="Web Development",
                    academic_title="Lecturer",
                    teacher_code="TEACHER01",
                    bio="Sample Teacher Bio",
                    approval_status=TeacherApprovalStatus.APPROVED
                )
                db.add(teacher_profile)

        db.commit()
        print(f"SUCCESS: Account '{clean_email}' is ready to login with password: '{password}'")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    target_email = sys.argv[1] if len(sys.argv) > 1 else "nguyentathuy2005@gmail.com"
    target_pass = sys.argv[2] if len(sys.argv) > 2 else "Password@123"
    target_role = sys.argv[3] if len(sys.argv) > 3 else "student"
    seed_or_reset_user(target_email, target_pass, target_role)
