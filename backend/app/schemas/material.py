from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.material import MaterialType, MaterialVisibility


class MaterialUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    visibility: Optional[MaterialVisibility] = None
    is_downloadable: Optional[bool] = None


class MaterialResponse(BaseModel):
    id: int
    course_id: int
    lesson_id: Optional[int] = None
    uploaded_by: Optional[int] = None
    
    title: str
    description: Optional[str] = None
    original_filename: str
    mime_type: Optional[str] = None
    file_extension: Optional[str] = None
    size_bytes: Optional[int] = None
    external_url: Optional[str] = None
    
    material_type: MaterialType
    visibility: MaterialVisibility
    is_downloadable: bool
    is_active: bool
    
    created_at: datetime
    updated_at: datetime
    
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
