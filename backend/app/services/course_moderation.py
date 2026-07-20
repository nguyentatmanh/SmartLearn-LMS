from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.course import Course, CourseStatus, CourseReviewStatus
from app.models.user import User, UserRole
from app.services.settings_service import SettingsService
from app.services.audit_service import log_audit_event, log_audit_failure


class CourseModerationService:
    @staticmethod
    def increment_content_revision(db: Session, course: Course) -> None:
        """
        Increment content_revision on edits.
        If course was previously approved or pending, reset review_status to not_submitted.
        """
        course.content_revision += 1
        if course.review_status in (CourseReviewStatus.APPROVED, CourseReviewStatus.PENDING):
            course.review_status = CourseReviewStatus.NOT_SUBMITTED
            course.approved_revision = None
            course.submitted_revision = None
        db.add(course)

    @staticmethod
    def submit_for_review(
        db: Session,
        course_id: int,
        teacher_id: int,
        ip_address: Optional[str] = None
    ) -> Course:
        course = db.query(Course).filter(Course.id == course_id).with_for_update().first()
        if not course:
            log_audit_failure("COURSE_SUBMIT_REVIEW", "course", teacher_id, str(course_id), {"error": "Not found"}, ip_address)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

        if course.teacher_id != teacher_id:
            log_audit_failure("COURSE_SUBMIT_REVIEW", "course", teacher_id, str(course_id), {"error": "Forbidden"}, ip_address)
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this course.")

        course.submitted_revision = course.content_revision
        course.review_status = CourseReviewStatus.PENDING
        course.submitted_for_review_at = datetime.now(timezone.utc)
        course.review_note = None

        db.add(course)
        log_audit_event(db, "COURSE_SUBMITTED_FOR_REVIEW", "course", teacher_id, str(course.id), "success", {"revision": course.content_revision}, ip_address=ip_address)
        db.commit()
        db.refresh(course)
        return course

    @staticmethod
    def approve_review(
        db: Session,
        course_id: int,
        admin_id: int,
        ip_address: Optional[str] = None
    ) -> Course:
        course = db.query(Course).filter(Course.id == course_id).with_for_update().first()
        if not course:
            log_audit_failure("COURSE_APPROVE_REVIEW", "course", admin_id, str(course_id), {"error": "Not found"}, ip_address)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

        if course.review_status != CourseReviewStatus.PENDING:
            log_audit_failure("COURSE_APPROVE_REVIEW", "course", admin_id, str(course_id), {"error": "Not pending review"}, ip_address)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "INVALID_REVIEW_STATE",
                    "message": "Course is not pending review."
                }
            )

        if course.submitted_revision != course.content_revision:
            log_audit_failure("COURSE_APPROVE_REVIEW", "course", admin_id, str(course_id), {"error": "COURSE_CHANGED_DURING_REVIEW"}, ip_address)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "COURSE_CHANGED_DURING_REVIEW",
                    "message": "Course content was modified after review submission. Re-submission is required."
                }
            )

        course.approved_revision = course.content_revision
        course.review_status = CourseReviewStatus.APPROVED
        course.reviewed_by = admin_id
        course.reviewed_at = datetime.now(timezone.utc)
        course.review_note = None

        db.add(course)
        log_audit_event(db, "COURSE_REVIEW_APPROVED", "course", admin_id, str(course.id), "success", {"approved_revision": course.approved_revision}, ip_address=ip_address)
        db.commit()
        db.refresh(course)
        return course

    @staticmethod
    def request_changes(
        db: Session,
        course_id: int,
        admin_id: int,
        review_note: str,
        ip_address: Optional[str] = None
    ) -> Course:
        if not review_note or not review_note.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review note is required when requesting changes.")

        course = db.query(Course).filter(Course.id == course_id).with_for_update().first()
        if not course:
            log_audit_failure("COURSE_REQUEST_CHANGES", "course", admin_id, str(course_id), {"error": "Not found"}, ip_address)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

        course.review_status = CourseReviewStatus.CHANGES_REQUESTED
        course.review_note = review_note.strip()
        course.reviewed_by = admin_id
        course.reviewed_at = datetime.now(timezone.utc)

        db.add(course)
        log_audit_event(db, "COURSE_CHANGES_REQUESTED", "course", admin_id, str(course.id), "success", {"review_note": review_note}, ip_address=ip_address)
        db.commit()
        db.refresh(course)
        return course

    @staticmethod
    def update_course_status(
        db: Session,
        course_id: int,
        target_status: CourseStatus,
        actor: User,
        ip_address: Optional[str] = None
    ) -> Course:
        course = db.query(Course).filter(Course.id == course_id).with_for_update().first()
        if not course:
            log_audit_failure("COURSE_STATUS_UPDATE", "course", actor.id, str(course_id), {"error": "Not found"}, ip_address)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

        settings = SettingsService.get_settings(db)

        # Restoring from ARCHIVED must revert to DRAFT, not directly to PUBLISHED
        if course.status == CourseStatus.ARCHIVED and target_status == CourseStatus.PUBLISHED:
            target_status = CourseStatus.DRAFT

        # Enforce review policy when publishing
        if target_status == CourseStatus.PUBLISHED:
            if settings.require_course_review and actor.role != UserRole.ADMIN:
                if course.review_status != CourseReviewStatus.APPROVED or course.approved_revision != course.content_revision:
                    log_audit_failure("COURSE_PUBLISH", "course", actor.id, str(course_id), {"error": "STALE_OR_MISSING_APPROVAL"}, ip_address)
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "code": "STALE_OR_MISSING_APPROVAL",
                            "message": "Course requires administrator approval matching current content revision before publication."
                        }
                    )

        old_status = course.status
        course.status = target_status
        db.add(course)

        log_audit_event(
            db=db,
            event_type="COURSE_STATUS_UPDATED",
            target_type="course",
            actor_id=actor.id,
            target_id=str(course.id),
            result="success",
            details={"old_status": old_status.value, "new_status": target_status.value},
            ip_address=ip_address
        )

        db.commit()
        db.refresh(course)
        return course
