from app.core.database import Base
from app.models.user import User, UserRole
from app.models.course import Course, CourseStatus
from app.models.lesson import Chapter, Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.otp import EmailVerificationOTP
from app.models.profile import UserProfile, TeacherProfile, TeacherApprovalStatus

# Expose Base metadata for Alembic migrations
metadata = Base.metadata
