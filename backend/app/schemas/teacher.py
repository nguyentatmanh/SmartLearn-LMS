from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field


class TeacherDashboardStatsResponse(BaseModel):
    total_courses: int = 0
    published_courses: int = 0
    draft_courses: int = 0
    archived_courses: int = 0
    total_unique_students: int = 0
    total_enrollments: int = 0
    total_materials: int = 0

    model_config = ConfigDict(from_attributes=True)


class TeacherStudentListItem(BaseModel):
    student_id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    enrolled_courses_count: int = 0
    average_progress_pct: float = 0.0
    recent_enrolled_at: datetime
    last_activity_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedTeacherStudentResponse(BaseModel):
    items: List[TeacherStudentListItem] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
    total_pages: int


class TeacherStudentCourseSummary(BaseModel):
    course_id: int
    course_title: str
    enrolled_at: datetime
    completed_lessons: int = 0
    total_lessons: int = 0
    progress_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class TeacherStudentDetailResponse(BaseModel):
    student_id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    enrolled_courses: List[TeacherStudentCourseSummary] = Field(default_factory=list)
    last_activity_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TeacherCoursePerformanceItem(BaseModel):
    course_id: int
    title: str
    status: str
    enrolled_students_count: int = 0
    completion_rate_pct: float = 0.0
    average_progress_pct: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class TeacherRecentEnrollmentItem(BaseModel):
    student_id: int
    student_name: str
    course_id: int
    course_title: str
    enrolled_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeacherAnalyticsResponse(BaseModel):
    total_unique_students: int = 0
    total_enrollments: int = 0
    average_progress_pct: float = 0.0
    completion_rate_pct: float = 0.0
    course_performance: List[TeacherCoursePerformanceItem] = Field(default_factory=list)
    recent_enrollments: List[TeacherRecentEnrollmentItem] = Field(default_factory=list)
    last_activity_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Query filter parameters enums/literals
ProgressStatusFilter = Literal["all", "not_started", "in_progress", "completed"]
StudentSortBy = Literal["enrolled_at", "full_name", "progress"]
SortOrder = Literal["asc", "desc"]
