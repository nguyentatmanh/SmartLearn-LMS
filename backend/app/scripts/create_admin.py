import os
import sys
from datetime import date
from sqlalchemy.orm import Session

# Add the parent directory of backend/app to PYTHONPATH so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.profile import UserProfile
from app.core.security import get_password_hash


def seed_admin():
    db: Session = SessionLocal()
    try:
        email = os.getenv("ADMIN_EMAIL", "admin@smartlearn.com").strip().lower()
        password = os.getenv("ADMIN_PASSWORD", "Admin@12345")
        full_name = os.getenv("ADMIN_FULL_NAME", "System Admin").strip()
        
        # Check if user already exists
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User with email {email} already exists. Upgrading to admin...")
            user.role = UserRole.ADMIN
            user.is_active = True
            user.email_verified = True
            user.is_approved = True
            user.hashed_password = get_password_hash(password)
        else:
            print(f"Creating new admin user {email}...")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role=UserRole.ADMIN,
                is_active=True,
                email_verified=True,
                is_approved=True
            )
            db.add(user)
            db.flush()  # Obtain user.id

        # Check if user profile exists
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            profile = UserProfile(
                user_id=user.id,
                full_name=full_name,
                phone_number="0000000000",
                date_of_birth=date(1990, 1, 1)
            )
            db.add(profile)
        else:
            profile.full_name = full_name

        db.commit()
        print("Admin account successfully seeded.")
        print(f"Email: {email}")
        print("Password: [Hidden]")
    except Exception as e:
        db.rollback()
        print(f"Error seeding admin: {str(e)}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
