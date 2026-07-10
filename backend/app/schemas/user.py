import re
from datetime import datetime, date
from typing import Optional
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
    role: UserRole
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileResponse] = None
    teacher_profile: Optional[TeacherProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class RegisterResponse(BaseModel):
    message: str
    email_verification_required: bool
    email: str


class EmailOtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class EmailOtpResendRequest(BaseModel):
    email: EmailStr


class TeacherRejectRequest(BaseModel):
    rejection_reason: Optional[str] = None


class UserActiveToggleRequest(BaseModel):
    is_active: bool


class UserRolePatchRequest(BaseModel):
    role: UserRole
