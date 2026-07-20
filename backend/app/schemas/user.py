import re
from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, model_validator
from app.models.user import UserRole
from app.models.profile import TeacherApprovalStatus


# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.STUDENT


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    phone_number: str
    date_of_birth: date
    
    # Optional fields for teacher registration
    faculty: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    academic_title: Optional[str] = None
    teacher_code: Optional[str] = None
    bio: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def clean_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Full name cannot be blank.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        # Accept simple local (e.g. 09xxxxxxxx) and international (e.g. +84xxxxxxxxx) phone formats
        if not re.match(r"^\+?[\d\s\-()]{9,15}$", cleaned):
            raise ValueError("Invalid phone number format. Must be 9 to 15 digits, optionally starting with '+'.")
        return cleaned

    @field_validator("date_of_birth")
    @classmethod
    def check_dob(cls, v: date) -> date:
        if v >= date.today():
            raise ValueError("Date of birth cannot be in the future.")
        return v

    @field_validator("role")
    @classmethod
    def check_role(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("Public registration of admin accounts is not permitted.")
        return v

    @model_validator(mode="after")
    def validate_teacher_fields(self) -> "UserCreate":
        if self.role == UserRole.TEACHER:
            if not self.faculty or not self.faculty.strip():
                raise ValueError("Faculty is required for teacher registration.")
            if not self.department or not self.department.strip():
                raise ValueError("Department is required for teacher registration.")
            if not self.specialization or not self.specialization.strip():
                raise ValueError("Specialization is required for teacher registration.")
        return self


# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    email_verified: Optional[bool] = None
    is_approved: Optional[bool] = None


class UserProfileResponse(BaseModel):
    full_name: str
    phone_number: Optional[str]
    date_of_birth: Optional[date]
    
    model_config = ConfigDict(from_attributes=True)


class TeacherProfileResponse(BaseModel):
    faculty: str
    department: str
    specialization: str
    academic_title: Optional[str] = None
    teacher_code: Optional[str] = None
    bio: Optional[str] = None
    approval_status: TeacherApprovalStatus
    rejection_reason: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileResponse] = None
    teacher_profile: Optional[TeacherProfileResponse] = None

    @model_validator(mode='before')
    @classmethod
    def resolve_user_full_name(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fn = data.get('full_name')
            if not fn or not str(fn).strip():
                prof = data.get('profile')
                if isinstance(prof, dict) and prof.get('full_name'):
                    data['full_name'] = prof['full_name']
                elif data.get('email'):
                    data['full_name'] = str(data['email']).split('@')[0]
                else:
                    data['full_name'] = 'Unnamed Account'
        elif hasattr(data, 'email'):
            fn = getattr(data, 'full_name', None)
            if not fn or not str(fn).strip():
                prof = getattr(data, 'profile', None)
                if prof and getattr(prof, 'full_name', None):
                    setattr(data, 'full_name', prof.full_name)
                elif getattr(data, 'email', None):
                    setattr(data, 'full_name', str(data.email).split('@')[0])
                else:
                    setattr(data, 'full_name', 'Unnamed Account')
        return data

    model_config = ConfigDict(from_attributes=True)


class RegisterResponse(BaseModel):
    message: str
    email_verification_required: bool
    email: str


class EmailOtpVerifyRequest(BaseModel):
    email: Optional[EmailStr] = None
    otp: str


class EmailOtpResendRequest(BaseModel):
    email: Optional[EmailStr] = None


class TeacherRejectRequest(BaseModel):
    rejection_reason: Optional[str] = None


class UserActiveToggleRequest(BaseModel):
    is_active: bool


class UserRolePatchRequest(BaseModel):
    role: UserRole


class AdminUserResponse(UserResponse):
    enrolled_courses_count: Optional[int] = None
    created_courses_count: Optional[int] = None


class StudentProfileSummary(BaseModel):
    enrolled_courses_count: int = 0
    active_courses_count: int = 0
    completed_courses_count: int = 0
    completed_lessons_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TeacherProfileDetail(BaseModel):
    faculty: str
    department: str
    specialization: str
    academic_title: Optional[str] = None
    teacher_code: Optional[str] = None
    bio: Optional[str] = None
    approval_status: TeacherApprovalStatus
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    reviewer_name: Optional[str] = None
    total_courses: int = 0
    published_courses: int = 0
    total_students: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminProfileSummary(BaseModel):
    admin_level: str = "System Administrator"

    model_config = ConfigDict(from_attributes=True)


class UserActivityItem(BaseModel):
    id: int
    event_type: str
    result: str
    created_at: datetime
    ip_address: Optional[str] = None
    description: str
    activity_category: str  # "target" | "actor"

    model_config = ConfigDict(from_attributes=True)


class DiscriminatedUserProfile(BaseModel):
    type: str  # "student" | "teacher" | "admin"
    student_details: Optional[StudentProfileSummary] = None
    teacher_details: Optional[TeacherProfileDetail] = None
    admin_details: Optional[AdminProfileSummary] = None


class UserDetailResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    email_verified: bool
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None

    profile: Optional[DiscriminatedUserProfile] = None
    recent_activities: List[UserActivityItem] = []

    model_config = ConfigDict(from_attributes=True)

