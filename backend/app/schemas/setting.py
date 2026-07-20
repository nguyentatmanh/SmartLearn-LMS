from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SystemSettingResponse(BaseModel):
    id: int
    require_teacher_approval: bool
    require_email_verification: bool
    require_course_review: bool
    updated_at: datetime
    updated_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class SystemSettingUpdate(BaseModel):
    require_teacher_approval: Optional[bool] = None
    require_email_verification: Optional[bool] = None
    require_course_review: Optional[bool] = None

    model_config = ConfigDict(extra="forbid")
