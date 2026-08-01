import math
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sa_func, select, desc, asc, or_

from app.models.user import User, UserRole
from app.models.course import Course, CourseStatus
from app.models.enrollment import Enrollment
from app.models.lesson import Chapter, Lesson, LessonStatus
from app.models.progress import LessonProgress
from app.models.material import LearningMaterial
from app.schemas.teacher import (
    TeacherDashboardStatsResponse,
    TeacherStudentListItem,
    PaginatedTeacherStudentResponse,
    TeacherStudentCourseSummary,
    TeacherStudentDetailResponse,
    TeacherCoursePerformanceItem,
    TeacherRecentEnrollmentItem,
    TeacherAnalyticsResponse,
    ProgressStatusFilter,
    StudentSortBy,
    SortOrder,
)


class TeacherService:
    @staticmethod
    def get_stats(db: Session, teacher_id: int) -> TeacherDashboardStatsResponse:
        """
        Consolidated single source of truth for teacher statistics.
        """
        courses = db.query(Course).filter(Course.teacher_id == teacher_id).all()
        course_ids = [c.id for c in courses]

        total_courses = len(courses)
        published_courses = sum(1 for c in courses if c.status == CourseStatus.PUBLISHED)
        draft_courses = sum(1 for c in courses if c.status == CourseStatus.DRAFT)
        archived_courses = sum(1 for c in courses if c.status == CourseStatus.ARCHIVED)

        total_unique_students = 0
        total_enrollments = 0
        total_materials = 0

        if course_ids:
            total_unique_students = (
                db.query(sa_func.count(sa_func.distinct(Enrollment.student_id)))
                .join(Course, Course.id == Enrollment.course_id)
                .filter(Course.teacher_id == teacher_id, Course.status != CourseStatus.ARCHIVED)
                .scalar()
                or 0
            )

            total_enrollments = (
                db.query(sa_func.count(Enrollment.id))
                .join(Course, Course.id == Enrollment.course_id)
                .filter(Course.teacher_id == teacher_id, Course.status != CourseStatus.ARCHIVED)
                .scalar()
                or 0
            )

            total_materials = (
                db.query(sa_func.count(LearningMaterial.id))
                .filter(LearningMaterial.course_id.in_(course_ids))
                .scalar()
                or 0
            )

        return TeacherDashboardStatsResponse(
            total_courses=total_courses,
            published_courses=published_courses,
            draft_courses=draft_courses,
            archived_courses=archived_courses,
            total_unique_students=total_unique_students,
            total_enrollments=total_enrollments,
            total_materials=total_materials,
        )

    @staticmethod
    def _get_published_visible_lesson_ids(db: Session, course_id: int) -> List[int]:
        """
        Helper: Get published & visible lesson IDs for a course.
        Foreign key path: Lesson.course_id -> Course.id
        """
        return [
            row[0]
            for row in db.query(Lesson.id)
            .filter(
                Lesson.course_id == course_id,
                Lesson.status == LessonStatus.PUBLISHED,
                Lesson.is_visible == True,
            )
            .all()
        ]

    @classmethod
    def get_students(
        cls,
        db: Session,
        teacher_id: int,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        course_id: Optional[int] = None,
        progress_status: ProgressStatusFilter = "all",
        sort_by: StudentSortBy = "enrolled_at",
        sort_order: SortOrder = "desc",
    ) -> PaginatedTeacherStudentResponse:
        """
        Paginated student roster across all courses owned by the authenticated teacher.
        """
        # Normalize pagination
        page = max(1, page)
        page_size = min(50, max(1, page_size))

        # Base query: Enrollments for courses owned by teacher
        query = (
            db.query(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .join(User, User.id == Enrollment.student_id)
            .filter(Course.teacher_id == teacher_id, Course.status != CourseStatus.ARCHIVED)
        )

        if course_id:
            query = query.filter(Enrollment.course_id == course_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(User.full_name.ilike(term), User.email.ilike(term))
            )

        all_enrollments = query.all()

        # Group enrollments by student
        student_map: Dict[int, List[Enrollment]] = {}
        for env in all_enrollments:
            student_map.setdefault(env.student_id, []).append(env)

        # Pre-fetch last activity timestamps for student_ids
        student_ids = list(student_map.keys())
        last_activity_map: Dict[int, Optional[datetime]] = {}
        if student_ids:
            # Foreign key join: LessonProgress -> Lesson -> Chapter -> Course
            activity_rows = (
                db.query(
                    LessonProgress.student_id,
                    sa_func.max(LessonProgress.completed_at).label("last_act")
                )
                .join(Lesson, Lesson.id == LessonProgress.lesson_id)
                .join(Course, Course.id == Lesson.course_id)
                .filter(
                    Course.teacher_id == teacher_id,
                    LessonProgress.student_id.in_(student_ids)
                )
                .group_by(LessonProgress.student_id)
                .all()
            )
            for sid, last_act in activity_rows:
                last_activity_map[sid] = last_act

        # Process student items
        student_items: List[TeacherStudentListItem] = []
        for sid, envs in student_map.items():
            user = envs[0].student
            enrolled_courses_count = len(envs)
            recent_enrolled_at = max(e.enrolled_at for e in envs)
            last_act = last_activity_map.get(sid)

            # Calculate progress for each enrollment
            progress_pcts: List[float] = []
            completed_flags: List[bool] = []
            zero_lesson_flags: List[bool] = []

            for env in envs:
                pv_lesson_ids = cls._get_published_visible_lesson_ids(db, env.course_id)
                total_lessons = len(pv_lesson_ids)
                if total_lessons == 0:
                    progress_pcts.append(0.0)
                    zero_lesson_flags.append(True)
                    completed_flags.append(False)
                else:
                    completed_count = (
                        db.query(sa_func.count(LessonProgress.id))
                        .filter(
                            LessonProgress.student_id == sid,
                            LessonProgress.lesson_id.in_(pv_lesson_ids),
                            LessonProgress.is_completed == True,
                        )
                        .scalar()
                        or 0
                    )
                    pct = (completed_count / total_lessons) * 100.0
                    progress_pcts.append(pct)
                    zero_lesson_flags.append(False)
                    completed_flags.append(completed_count == total_lessons)

            avg_progress = sum(progress_pcts) / len(progress_pcts) if progress_pcts else 0.0

            # Determine progress_status for filtering
            # not_started: no completed progress in any enrollment (all progress == 0)
            # completed: all non-zero-lesson enrollments are complete and at least 1 non-zero-lesson course exists
            # in_progress: otherwise
            has_any_completed_lessons = any(p > 0 for p in progress_pcts)
            all_valid_courses_completed = (
                len(completed_flags) > 0 and
                all(completed_flags) and
                not all(zero_lesson_flags)
            )

            if not has_any_completed_lessons:
                calculated_status = "not_started"
            elif all_valid_courses_completed:
                calculated_status = "completed"
            else:
                calculated_status = "in_progress"

            if progress_status != "all" and calculated_status != progress_status:
                continue

            student_items.append(
                TeacherStudentListItem(
                    student_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    avatar_url=getattr(user, "avatar_url", None),
                    enrolled_courses_count=enrolled_courses_count,
                    average_progress_pct=round(avg_progress, 2),
                    recent_enrolled_at=recent_enrolled_at,
                    last_activity_at=last_act,
                )
            )

        # Sort items
        reverse_sort = (sort_order == "desc")
        if sort_by == "full_name":
            student_items.sort(key=lambda x: x.full_name.lower(), reverse=reverse_sort)
        elif sort_by == "progress":
            student_items.sort(key=lambda x: x.average_progress_pct, reverse=reverse_sort)
        else:  # enrolled_at
            student_items.sort(key=lambda x: x.recent_enrolled_at, reverse=reverse_sort)

        total = len(student_items)
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        # Paginate
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_items = student_items[start_idx:end_idx]

        return PaginatedTeacherStudentResponse(
            items=paginated_items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @classmethod
    def get_student_detail(
        cls, db: Session, teacher_id: int, student_id: int
    ) -> TeacherStudentDetailResponse:
        """
        Detailed course progress breakdown for a student.
        Enforces HTTP 404 if student is not enrolled in any course owned by teacher.
        """
        teacher_courses = (
            db.query(Course)
            .filter(Course.teacher_id == teacher_id, Course.status != CourseStatus.ARCHIVED)
            .all()
        )
        t_course_ids = [c.id for c in teacher_courses]

        if not t_course_ids:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

        enrollments = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == student_id,
                Enrollment.course_id.in_(t_course_ids),
            )
            .all()
        )

        if not enrollments:
            # HTTP 404 to avoid revealing student existence across other teachers
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

        student = enrollments[0].student

        # Fetch last activity
        last_act = (
            db.query(sa_func.max(LessonProgress.completed_at))
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Course, Course.id == Lesson.course_id)
            .filter(
                Course.teacher_id == teacher_id,
                LessonProgress.student_id == student_id
            )
            .scalar()
        )

        course_summaries: List[TeacherStudentCourseSummary] = []
        for env in enrollments:
            course = env.course
            pv_lesson_ids = cls._get_published_visible_lesson_ids(db, course.id)
            total_lessons = len(pv_lesson_ids)

            completed = 0
            if total_lessons > 0:
                completed = (
                    db.query(sa_func.count(LessonProgress.id))
                    .filter(
                        LessonProgress.student_id == student_id,
                        LessonProgress.lesson_id.in_(pv_lesson_ids),
                        LessonProgress.is_completed == True,
                    )
                    .scalar()
                    or 0
                )

            progress_pct = (completed / total_lessons * 100.0) if total_lessons > 0 else 0.0

            course_summaries.append(
                TeacherStudentCourseSummary(
                    course_id=course.id,
                    course_title=course.title,
                    enrolled_at=env.enrolled_at,
                    completed_lessons=completed,
                    total_lessons=total_lessons,
                    progress_percentage=round(progress_pct, 2),
                )
            )

        return TeacherStudentDetailResponse(
            student_id=student.id,
            full_name=student.full_name,
            email=student.email,
            avatar_url=getattr(student, "avatar_url", None),
            enrolled_courses=course_summaries,
            last_activity_at=last_act,
        )

    @classmethod
    def get_analytics(cls, db: Session, teacher_id: int) -> TeacherAnalyticsResponse:
        """
        Teaching Operations Analytics aggregator.
        """
        courses = (
            db.query(Course)
            .filter(Course.teacher_id == teacher_id, Course.status != CourseStatus.ARCHIVED)
            .all()
        )

        if not courses:
            return TeacherAnalyticsResponse(
                total_unique_students=0,
                total_enrollments=0,
                average_progress_pct=0.0,
                completion_rate_pct=0.0,
                course_performance=[],
                recent_enrollments=[],
                last_activity_at=None,
            )

        course_ids = [c.id for c in courses]

        total_unique_students = (
            db.query(sa_func.count(sa_func.distinct(Enrollment.student_id)))
            .filter(Enrollment.course_id.in_(course_ids))
            .scalar()
            or 0
        )

        all_enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.course_id.in_(course_ids))
            .all()
        )
        total_enrollments = len(all_enrollments)

        # Per-course breakdown
        course_performance: List[TeacherCoursePerformanceItem] = []
        enrollment_progresses: List[float] = []
        completed_enrollments_count = 0

        for course in courses:
            pv_lesson_ids = cls._get_published_visible_lesson_ids(db, course.id)
            total_lessons = len(pv_lesson_ids)

            c_enrollments = [e for e in all_enrollments if e.course_id == course.id]
            c_student_count = len(c_enrollments)

            c_progress_list: List[float] = []
            c_completed_count = 0

            for env in c_enrollments:
                if total_lessons == 0:
                    pct = 0.0
                else:
                    c_completed = (
                        db.query(sa_func.count(LessonProgress.id))
                        .filter(
                            LessonProgress.student_id == env.student_id,
                            LessonProgress.lesson_id.in_(pv_lesson_ids),
                            LessonProgress.is_completed == True,
                        )
                        .scalar()
                        or 0
                    )
                    pct = (c_completed / total_lessons) * 100.0
                    if c_completed == total_lessons:
                        c_completed_count += 1
                        completed_enrollments_count += 1

                c_progress_list.append(pct)
                enrollment_progresses.append(pct)

            c_avg_progress = (sum(c_progress_list) / c_student_count) if c_student_count > 0 else 0.0
            c_completion_rate = (c_completed_count / c_student_count * 100.0) if c_student_count > 0 else 0.0

            course_performance.append(
                TeacherCoursePerformanceItem(
                    course_id=course.id,
                    title=course.title,
                    status=course.status.value,
                    enrolled_students_count=c_student_count,
                    completion_rate_pct=round(c_completion_rate, 2),
                    average_progress_pct=round(c_avg_progress, 2),
                )
            )

        average_progress_pct = (sum(enrollment_progresses) / total_enrollments) if total_enrollments > 0 else 0.0
        completion_rate_pct = (completed_enrollments_count / total_enrollments * 100.0) if total_enrollments > 0 else 0.0

        # Recent enrollments (top 5)
        recent_envs = (
            db.query(Enrollment)
            .filter(Enrollment.course_id.in_(course_ids))
            .order_by(desc(Enrollment.enrolled_at))
            .limit(5)
            .all()
        )

        recent_items = [
            TeacherRecentEnrollmentItem(
                student_id=e.student_id,
                student_name=e.student.full_name,
                course_id=e.course_id,
                course_title=e.course.title,
                enrolled_at=e.enrolled_at,
            )
            for e in recent_envs
        ]

        # Overall last activity
        last_activity_at = (
            db.query(sa_func.max(LessonProgress.completed_at))
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Course, Course.id == Lesson.course_id)
            .filter(Course.teacher_id == teacher_id)
            .scalar()
        )

        return TeacherAnalyticsResponse(
            total_unique_students=total_unique_students,
            total_enrollments=total_enrollments,
            average_progress_pct=round(average_progress_pct, 2),
            completion_rate_pct=round(completion_rate_pct, 2),
            course_performance=course_performance,
            recent_enrollments=recent_items,
            last_activity_at=last_activity_at,
        )
