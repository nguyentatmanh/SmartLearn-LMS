from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, computed_field
from app.models.course import CourseStatus, CourseLevel, CourseReviewStatus
from app.schemas.lesson import ChapterWithLessonsResponse


class CourseBase(BaseModel):
    title: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    level: CourseLevel = CourseLevel.BEGINNER
    specialization: Optional[str] = None
    estimated_duration: Optional[str] = None
    prerequisites: Optional[str] = None
    learning_outcomes: Optional[str] = None
    status: CourseStatus = CourseStatus.DRAFT


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    level: Optional[CourseLevel] = None
    specialization: Optional[str] = None
    estimated_duration: Optional[str] = None
    prerequisites: Optional[str] = None
    learning_outcomes: Optional[str] = None
    status: Optional[CourseStatus] = None


class CourseInDBBase(CourseBase):
    id: int
    teacher_id: int
    cover_image_source: Optional[str] = None
    cover_external_url: Optional[str] = None
    cover_mime_type: Optional[str] = None
    cover_updated_at: Optional[datetime] = None

    review_status: CourseReviewStatus = CourseReviewStatus.NOT_SUBMITTED
    content_revision: int = 1
    submitted_revision: Optional[int] = None
    approved_revision: Optional[int] = None
    submitted_for_review_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    review_note: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def cover_display_url(self) -> Optional[str]:
        if self.cover_image_source == "upload":
            return f"/api/v1/courses/{self.id}/cover"
        if self.cover_image_source == "external" and self.cover_external_url:
            return self.cover_external_url
        if self.thumbnail_url:
            return self.thumbnail_url
        return None

    @computed_field
    @property
    def chapters_count(self) -> int:
        return len(self.chapters) if hasattr(self, "chapters") and self.chapters is not None else 0

    @computed_field
    @property
    def lessons_count(self) -> int:
        return len(self.lessons) if hasattr(self, "lessons") and self.lessons is not None else 0

    @computed_field
    @property
    def enrollments_count(self) -> int:
        return len(self.enrollments) if hasattr(self, "enrollments") and self.enrollments is not None else 0


class CourseResponse(CourseInDBBase):
    pass


class CourseTeacherResponse(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class CourseDetailResponse(CourseResponse):
    teacher: CourseTeacherResponse
    chapters: List[ChapterWithLessonsResponse] = []


class AdminCourseResponse(CourseResponse):
    teacher: CourseTeacherResponse


class CourseStatusPatchRequest(BaseModel):
    status: CourseStatus


class CourseReviewRequestNotes(BaseModel):
    review_note: str


class CourseCoverExternalRequest(BaseModel):
    cover_external_url: str


class TeacherDashboardStats(BaseModel):
    total_courses: int = 0
    published_courses: int = 0
    draft_courses: int = 0
    archived_courses: int = 0
    total_students: int = 0
    total_materials: int = 0


class CourseStudentProgress(BaseModel):
    student_id: int
    full_name: str
    email: str
    enrolled_at: datetime
    completed_lessons: int = 0
    total_lessons: int = 0
    progress_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class LessonProgressDetail(BaseModel):
    lesson_id: int
    lesson_title: str
    chapter_title: str
    is_completed: bool = False
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudentCourseProgressDetail(BaseModel):
    student_id: int
    full_name: str
    email: str
    enrolled_at: datetime
    completed_lessons: int = 0
    total_lessons: int = 0
    progress_percentage: float = 0.0
    lessons: List[LessonProgressDetail] = []
