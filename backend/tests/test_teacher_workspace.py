import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.course import Course, CourseStatus, CourseReviewStatus
from app.models.lesson import Chapter, Lesson, LessonStatus
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.profile import TeacherProfile, TeacherApprovalStatus
from app.services.course_readiness import CourseReadinessService
from app.services.course_moderation import CourseModerationService
from app.services.teacher_service import TeacherService


def create_test_teacher(db: Session, email: str, full_name: str) -> User:
    user = User(
        email=email,
        hashed_password="hashed_password_123",
        full_name=full_name,
        role=UserRole.TEACHER,
        is_active=True,
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = TeacherProfile(
        user_id=user.id,
        approval_status=TeacherApprovalStatus.APPROVED,
    )
    db.add(profile)
    db.commit()
    return user


def create_test_student(db: Session, email: str, full_name: str) -> User:
    user = User(
        email=email,
        hashed_password="hashed_password_123",
        full_name=full_name,
        role=UserRole.STUDENT,
        is_active=True,
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_readiness_service_validation(db: Session):
    teacher = create_test_teacher(db, "teacher_readiness@test.com", "Readiness Teacher")

    # 1. Create course without chapters/lessons
    course = Course(
        title="Empty Course",
        teacher_id=teacher.id,
        status=CourseStatus.DRAFT,
        review_status=CourseReviewStatus.NOT_SUBMITTED,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # 2. Check readiness -> should be False
    readiness = CourseReadinessService.get_readiness(db, course.id)
    assert readiness["is_ready"] is False
    assert "at_least_one_chapter" in readiness["missing_requirements"]
    assert "at_least_one_lesson" in readiness["missing_requirements"]

    # 3. Submitting empty course for review should raise HTTP 400
    with pytest.raises(HTTPException) as exc_info:
        CourseModerationService.submit_for_review(db, course.id, teacher.id)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "COURSE_INCOMPLETE"

    # 4. Add 1 chapter and 1 lesson
    chapter = Chapter(course_id=course.id, title="Chapter 1", order_index=1)
    db.add(chapter)
    db.commit()
    db.refresh(chapter)

    lesson = Lesson(
        course_id=course.id,
        chapter_id=chapter.id,
        title="Lesson 1",
        status=LessonStatus.PUBLISHED,
        order_index=1,
    )
    db.add(lesson)
    db.commit()

    # 5. Now readiness should be True
    readiness_after = CourseReadinessService.get_readiness(db, course.id)
    assert readiness_after["is_ready"] is True

    # 6. Submission for review should now succeed
    submitted_course = CourseModerationService.submit_for_review(db, course.id, teacher.id)
    assert submitted_course.review_status == CourseReviewStatus.PENDING


def test_readiness_deletion_guard_on_published_course(db: Session):
    teacher = create_test_teacher(db, "teacher_del@test.com", "Deletion Teacher")

    course = Course(
        title="Published Course",
        teacher_id=teacher.id,
        status=CourseStatus.PUBLISHED,
    )
    db.add(course)
    db.commit()

    chapter = Chapter(course_id=course.id, title="Chapter 1", order_index=1)
    db.add(chapter)
    db.commit()

    lesson = Lesson(
        course_id=course.id,
        chapter_id=chapter.id,
        title="Lesson 1",
        status=LessonStatus.PUBLISHED,
        order_index=1,
    )
    db.add(lesson)
    db.commit()

    # Deleting the last lesson of a PUBLISHED course should raise HTTP 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        CourseReadinessService.validate_lesson_or_chapter_deletion(
            db, course, deleting_lesson_id=lesson.id
        )
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == "DELETION_BLOCKED_PUBLISHED_COURSE"

    # Move course to draft -> deletion validation passes silently
    course.status = CourseStatus.DRAFT
    db.add(course)
    db.commit()

    CourseReadinessService.validate_lesson_or_chapter_deletion(
        db, course, deleting_lesson_id=lesson.id
    )


def test_student_count_accuracy_and_invariants(db: Session):
    teacher = create_test_teacher(db, "teacher_stats@test.com", "Stats Teacher")
    student1 = create_test_student(db, "student1@test.com", "Student One")

    course1 = Course(title="Course 101", teacher_id=teacher.id, status=CourseStatus.PUBLISHED)
    course2 = Course(title="Course 102", teacher_id=teacher.id, status=CourseStatus.PUBLISHED)
    db.add_all([course1, course2])
    db.commit()

    # Student 1 enrolled in BOTH courses owned by teacher
    env1 = Enrollment(student_id=student1.id, course_id=course1.id)
    env2 = Enrollment(student_id=student1.id, course_id=course2.id)
    db.add_all([env1, env2])
    db.commit()

    # Teacher stats calculation
    stats = TeacherService.get_stats(db, teacher.id)

    # Unique students across teacher's courses MUST be 1
    assert stats.total_unique_students == 1
    # Total enrollments MUST be 2
    assert stats.total_enrollments == 2

    # Invariant test: Single course with 1 enrollment
    teacher_b = create_test_teacher(db, "teacher_single@test.com", "Teacher Single")
    course_b = Course(title="Course B", teacher_id=teacher_b.id, status=CourseStatus.PUBLISHED)
    db.add(course_b)
    db.commit()

    env_b = Enrollment(student_id=student1.id, course_id=course_b.id)
    db.add(env_b)
    db.commit()

    stats_b = TeacherService.get_stats(db, teacher_b.id)
    assert stats_b.total_unique_students == 1
    assert stats_b.total_enrollments == 1

    analytics_b = TeacherService.get_analytics(db, teacher_b.id)
    assert len(analytics_b.course_performance) == 1
    assert analytics_b.course_performance[0].enrolled_students_count == 1


def test_student_detail_isolation(db: Session):
    teacher_a = create_test_teacher(db, "teacher_a@test.com", "Teacher A")
    teacher_b = create_test_teacher(db, "teacher_b@test.com", "Teacher B")
    student = create_test_student(db, "student_priv@test.com", "Private Student")

    course_a = Course(title="Teacher A Course", teacher_id=teacher_a.id, status=CourseStatus.PUBLISHED)
    db.add(course_a)
    db.commit()

    env = Enrollment(student_id=student.id, course_id=course_a.id)
    db.add(env)
    db.commit()

    # Teacher A can view student details
    detail = TeacherService.get_student_detail(db, teacher_id=teacher_a.id, student_id=student.id)
    assert detail.student_id == student.id
    assert len(detail.enrolled_courses) == 1

    # Teacher B attempting to view student NOT enrolled in Teacher B's courses MUST raise HTTP 404
    with pytest.raises(HTTPException) as exc_info:
        TeacherService.get_student_detail(db, teacher_id=teacher_b.id, student_id=student.id)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Student not found."


def test_analytics_division_by_zero_safety(db: Session):
    teacher_empty = create_test_teacher(db, "teacher_zero@test.com", "Zero Teacher")

    # Analytics for teacher with 0 courses & 0 enrollments
    analytics = TeacherService.get_analytics(db, teacher_empty.id)
    assert analytics.total_unique_students == 0
    assert analytics.total_enrollments == 0
    assert analytics.average_progress_pct == 0.0
    assert analytics.completion_rate_pct == 0.0
    assert analytics.course_performance == []
    assert analytics.recent_enrollments == []
