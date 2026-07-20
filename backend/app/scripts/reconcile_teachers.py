import argparse
import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.profile import TeacherProfile, TeacherApprovalStatus


def reconcile_teachers(apply: bool = False) -> None:
    db: Session = SessionLocal()
    try:
        print(f"=== SmartLearn LMS Teacher Approval Reconciliation ===")
        print(f"Mode: {'APPLY (Mutations Enabled)' if apply else 'DRY RUN (Read-Only)'}\n")

        teachers = db.query(User).filter(User.role == UserRole.TEACHER).all()
        print(f"Total Teacher Users found: {len(teachers)}")

        missing_profile_count = 0
        inconsistent_approval_count = 0
        consistent_count = 0

        for t in teachers:
            if not t.teacher_profile:
                missing_profile_count += 1
                print(f"  [MISSING PROFILE] User ID {t.id} ({t.email}) has role='teacher' but no TeacherProfile.")
                continue

            expected_is_approved = (t.teacher_profile.approval_status == TeacherApprovalStatus.APPROVED)
            if t.is_approved != expected_is_approved:
                inconsistent_approval_count += 1
                print(f"  [INCONSISTENT] User ID {t.id} ({t.email}): User.is_approved={t.is_approved} vs TeacherProfile.approval_status={t.teacher_profile.approval_status.value}")
                
                if apply:
                    t.is_approved = expected_is_approved
                    db.add(t)
            else:
                consistent_count += 1

        print("\n=== Summary Report ===")
        print(f"Consistent Teachers: {consistent_count}")
        print(f"Inconsistent is_approved sync records: {inconsistent_approval_count}")
        print(f"Missing TeacherProfile records: {missing_profile_count}")

        if apply and inconsistent_approval_count > 0:
            db.commit()
            print("\nSuccessfully applied reconciliation changes to database.")
        elif not apply and (inconsistent_approval_count > 0 or missing_profile_count > 0):
            print("\nRun with '--apply' to repair inconsistent sync flags.")
            print("Note: Users missing a TeacherProfile are NOT auto-generated with dummy credentials. They remain blocked until manually completed.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reconcile teacher approval flags across database tables.")
    parser.add_argument("--apply", action="store_true", help="Apply fixes to database (default is dry-run)")
    args = parser.parse_args()
    reconcile_teachers(apply=args.apply)
