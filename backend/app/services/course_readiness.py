from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.course import Course, CourseStatus
from app.models.lesson import Chapter, Lesson


class CourseReadinessService:
    @staticmethod
    def get_readiness(db: Session, course_id: int) -> Dict[str, Any]:
        """
        Calculates content readiness for a given course.
        A course is ready if it has at least 1 chapter and at least 1 lesson.
        """
        chapter_count = db.query(Chapter).filter(Chapter.course_id == course_id).count()
        lesson_count = db.query(Lesson).filter(Lesson.course_id == course_id).count()

        missing: List[str] = []
        if chapter_count == 0:
            missing.append("at_least_one_chapter")
        if lesson_count == 0:
            missing.append("at_least_one_lesson")

        is_ready = len(missing) == 0

        return {
            "course_id": course_id,
            "chapter_count": chapter_count,
            "lesson_count": lesson_count,
            "is_ready": is_ready,
            "missing_requirements": missing,
        }

    @classmethod
    def validate_for_review_or_publish(cls, db: Session, course: Course) -> None:
        """
        Enforces content readiness before review submission, admin approval,
        or direct publication status updates.
        """
        readiness = cls.get_readiness(db, course.id)
        if not readiness["is_ready"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "COURSE_INCOMPLETE",
                    "message": "Khóa học phải có ít nhất 1 chương và 1 bài học trước khi gửi duyệt hoặc xuất bản.",
                    "missing": readiness["missing_requirements"],
                },
            )

    @classmethod
    def validate_lesson_or_chapter_deletion(
        cls,
        db: Session,
        course: Course,
        deleting_chapter_id: Optional[int] = None,
        deleting_lesson_id: Optional[int] = None,
    ) -> None:
        """
        Blocks deletion of the final chapter or lesson from a PUBLISHED course with HTTP 409 Conflict.
        Requires an explicit unpublish/draft transition before destructive deletion.
        """
        if course.status != CourseStatus.PUBLISHED:
            return

        total_chapters = db.query(Chapter).filter(Chapter.course_id == course.id).count()
        total_lessons = db.query(Lesson).filter(Lesson.course_id == course.id).count()

        if deleting_chapter_id is not None:
            # Also calculate lessons that belong to this chapter that will be deleted
            chapter_lessons = db.query(Lesson).filter(Lesson.chapter_id == deleting_chapter_id).count()
            remaining_chapters = total_chapters - 1
            remaining_lessons = total_lessons - chapter_lessons
        elif deleting_lesson_id is not None:
            remaining_chapters = total_chapters
            remaining_lessons = total_lessons - 1
        else:
            remaining_chapters = total_chapters
            remaining_lessons = total_lessons

        if remaining_chapters <= 0 or remaining_lessons <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DELETION_BLOCKED_PUBLISHED_COURSE",
                    "message": "Không thể xóa bài học hoặc chương cuối cùng của khóa học đang xuất bản. Vui lòng chuyển trạng thái khóa học sang Bản nháp trước khi xóa.",
                },
            )
