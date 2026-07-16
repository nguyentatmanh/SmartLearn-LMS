import os
import re
import uuid
import logging
import urllib.parse
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.api import deps
from app.models.user import User, UserRole
from app.models.course import Course, CourseStatus
from app.models.lesson import Lesson, LessonStatus
from app.models.enrollment import Enrollment
from app.models.material import LearningMaterial, MaterialType, MaterialVisibility
from app.schemas.material import MaterialUpdate, MaterialResponse
from app.storage.storage_service import get_storage_provider
from app.storage.exceptions import FileTooLargeError, StorageError, StorageObjectNotFoundError

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    # PDFs
    ".pdf": ["application/pdf"],
    # Documents
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ".doc": ["application/msword"],
    ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ".ppt": ["application/vnd.ms-powerpoint"],
    ".txt": ["text/plain"],
    # Images
    ".png": ["image/png"],
    ".jpg": ["image/jpeg", "image/jpg"],
    ".jpeg": ["image/jpeg"],
    ".gif": ["image/gif"],
    # ZIP / Source
    ".zip": ["application/zip", "application/x-zip-compressed"],
    ".rar": ["application/x-rar-compressed", "application/octet-stream"],
    # Video (if enabled)
    ".mp4": ["video/mp4"],
    ".mkv": ["video/x-matroska"],
}

# Expanded to block scripts, executables, installers, and web archives
DISALLOWED_EXTENSIONS = {
    ".exe", ".bat", ".sh", ".cmd", ".msi", ".com", ".scr", ".js", ".vbs",
    ".py", ".php", ".pl", ".jsp", ".asp", ".aspx", ".html", ".htm", ".cgi",
    ".jar", ".war", ".c", ".cpp", ".go", ".rs", ".swift"
}

SAFE_PREVIEW_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
}


def sanitize_filename(filename: str) -> str:
    """Sanitizes original filename to prevent path traversal and clean up symbols."""
    base = os.path.basename(filename)
    sanitized = re.sub(r"[^\w\s\.-]", "", base)
    sanitized = re.sub(r"\s+", " ", sanitized).strip()
    return sanitized or "unnamed_file"


def get_download_url(material: LearningMaterial) -> Optional[str]:
    """Generates dynamic local download URL if material is a file."""
    if material.material_type == MaterialType.EXTERNAL_LINK:
        return None
    return f"/api/v1/materials/{material.id}/download"


def validate_external_url(url: str) -> None:
    """
    Validate external URLs to prevent HTTP response splitting, SSRF, XSS, or protocol manipulation.
    Accepts only normalized http and https schemes with a valid hostname.
    """
    if not url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="External URL cannot be empty.")

    # Check for control characters (CRLF injection, tab, null byte, etc.)
    if any(c in url for c in "\r\n\t\x00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL contains invalid or control characters.")

    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed URL structure.")

    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL scheme. Only http and https protocols are allowed."
        )

    if not parsed.netloc or not parsed.hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL structure. Missing domain or hostname."
        )

    # Re-validate low-level protocol prefixes to reject obfuscated schemes
    normalized_url = url.lower().strip()
    bad_prefixes = ("javascript:", "data:", "file:", "ftp:", "vbscript:")
    if any(normalized_url.startswith(p) for p in bad_prefixes):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL scheme/protocol not allowed.")


from app.models.profile import TeacherApprovalStatus


def check_material_action_allowed(
    material: LearningMaterial,
    action: str,  # "view", "stream", "download", "edit", "archive", "permanent_delete"
    current_user: User,
    db: Session
) -> None:
    """
    Action-based access helper for LearningMaterial resources.
    Verifies material active state, course state, lesson state, ownership, enrollment, visibility,
    account activity, email verification, and teacher approval.
    """
    # Account status checks
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account.")
    if not current_user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email address not verified.")

    course = material.course
    is_owner = (current_user.role == UserRole.TEACHER and course.teacher_id == current_user.id)
    is_admin = (current_user.role == UserRole.ADMIN)

    # 1. Hard deletion is restricted to admin-only
    if action == "permanent_delete":
        if not is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can permanently delete materials.")
        return

    # 2. Edit / Archive operations
    if action in ("edit", "archive"):
        if not (is_owner or is_admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You do not own this course.")
        return

    # 3. Read actions: view, stream, download
    # Owner or Admin has unrestricted access for reading/downloading
    if is_owner or is_admin:
        # Prevent streaming of non-previewable files even for owners to be consistent with MIME support
        if action == "stream":
            if material.mime_type not in SAFE_PREVIEW_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Inline preview is not supported for this file type. Please download the file."
                )
        return

    # Student Rules:
    # A. Active state check: students cannot view archived/deleted materials
    if not material.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Material is archived.")

    # B. Visibility check: students cannot see teacher-only materials
    if material.visibility == MaterialVisibility.TEACHER_ONLY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Teacher only resource.")

    # C. Course state check: course must be published
    if course.status != CourseStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Course is not published.")

    # D. Lesson state check: if attached to a lesson, lesson must be visible and published
    if material.lesson_id:
        lesson = material.lesson
        if not lesson or not lesson.is_visible or lesson.status != LessonStatus.PUBLISHED:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Lesson is not visible or published.")

    # E. Enrollment check: if visibility is enrolled_students, the student must be actively enrolled
    if material.visibility == MaterialVisibility.ENROLLED_STUDENTS:
        enroll = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course.id
        ).first()
        if not enroll:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You must enroll in this course first.")

    # F. Downloadable check: is_downloadable=False blocks download endpoint
    if action == "download":
        if not material.is_downloadable:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This file is configured as view-only and cannot be downloaded.")

    # G. Stream preview limits: only PDF and safe images
    if action == "stream":
        if material.mime_type not in SAFE_PREVIEW_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Inline preview is not supported for this file type. Please download the file."
            )


# --- Teacher materials retrieval ---

@router.get("/teacher/materials", response_model=List[MaterialResponse])
def get_teacher_materials(
    course_id: Optional[int] = None,
    lesson_id: Optional[int] = None,
    material_type: Optional[MaterialType] = None,
    visibility: Optional[MaterialVisibility] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Retrieve only materials belonging to courses owned by the current approved teacher.
    Supports filters: course_id, lesson_id, material_type, visibility, is_active, search.
    """
    query = db.query(LearningMaterial).join(Course).filter(Course.teacher_id == current_user.id)
    
    if course_id is not None:
        query = query.filter(LearningMaterial.course_id == course_id)
    if lesson_id is not None:
        query = query.filter(LearningMaterial.lesson_id == lesson_id)
    if material_type is not None:
        query = query.filter(LearningMaterial.material_type == material_type)
    if visibility is not None:
        query = query.filter(LearningMaterial.visibility == visibility)
    if is_active is not None:
        query = query.filter(LearningMaterial.is_active == is_active)
    if search:
        query = query.filter(
            LearningMaterial.title.ilike(f"%{search}%") | 
            LearningMaterial.description.ilike(f"%{search}%")
        )
        
    offset = (page - 1) * page_size
    materials = query.order_by(LearningMaterial.created_at.desc()).offset(offset).limit(page_size).all()
    
    for m in materials:
        m.download_url = get_download_url(m)
        
    return materials


# --- Course / Lesson materials list ---

@router.get("/courses/{course_id}/materials", response_model=List[MaterialResponse])
def get_course_materials(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List all materials for a course.
    - Teachers see all active/inactive materials.
    - Students see only active, non-teacher-only materials if course is published and enrolled.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    is_teacher = (current_user.role == UserRole.TEACHER and course.teacher_id == current_user.id)
    is_admin = (current_user.role == UserRole.ADMIN)
    
    query = db.query(LearningMaterial).filter(LearningMaterial.course_id == course_id)
    
    if not (is_teacher or is_admin):
        # Student or other users
        if course.status != CourseStatus.PUBLISHED:
            raise HTTPException(status_code=403, detail="Access denied. Course is not published.")
            
        enroll = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id
        ).first()
        
        # Enforce enrollment check
        if not enroll:
            raise HTTPException(status_code=403, detail="Access denied. You must enroll first.")
            
        # Students see active materials, filter out TEACHER_ONLY
        query = query.filter(
            LearningMaterial.is_active == True,
            LearningMaterial.visibility != MaterialVisibility.TEACHER_ONLY
        )
        
    materials = query.order_by(LearningMaterial.created_at.desc()).all()
    for m in materials:
        m.download_url = get_download_url(m)
        
    return materials


@router.get("/lessons/{lesson_id}/materials", response_model=List[MaterialResponse])
def get_lesson_materials(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List all materials for a specific lesson.
    - Teachers see all.
    - Students see active, non-teacher-only materials if enrolled and course/lesson is published.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    course = lesson.course
    is_teacher = (current_user.role == UserRole.TEACHER and course.teacher_id == current_user.id)
    is_admin = (current_user.role == UserRole.ADMIN)
    
    query = db.query(LearningMaterial).filter(LearningMaterial.lesson_id == lesson_id)
    
    if not (is_teacher or is_admin):
        if not lesson.is_visible or lesson.status != LessonStatus.PUBLISHED or course.status != CourseStatus.PUBLISHED:
            raise HTTPException(status_code=403, detail="Access denied. Lesson is not visible.")
            
        enroll = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course.id
        ).first()
        
        if not enroll:
            raise HTTPException(status_code=403, detail="Access denied. You must enroll first.")
            
        query = query.filter(
            LearningMaterial.is_active == True,
            LearningMaterial.visibility != MaterialVisibility.TEACHER_ONLY
        )
        
    materials = query.order_by(LearningMaterial.created_at.desc()).all()
    for m in materials:
        m.download_url = get_download_url(m)
        
    return materials


# --- Upload endpoints ---

@router.post("/courses/{course_id}/materials/upload", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_course_material(
    course_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    material_type: MaterialType = Form(MaterialType.DOCUMENT),
    visibility: MaterialVisibility = Form(MaterialVisibility.ENROLLED_STUDENTS),
    is_downloadable: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Upload a course-level file material.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this course.")
        
    # File Validation
    original_name = file.filename or "upload"
    ext = os.path.splitext(original_name)[1].lower()
    
    if ext in DISALLOWED_EXTENSIONS or ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Disallowed or unrecognized file type extension.")
        
    if file.content_type not in ALLOWED_TYPES[ext]:
        raise HTTPException(status_code=400, detail="MIME type mismatch for file extension.")
        
    # Size check limits
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if ext in [".mp4", ".mkv"]:
        if not settings.ENABLE_VIDEO_UPLOAD:
            raise HTTPException(status_code=400, detail="Video uploads are currently disabled. Please use video URLs instead.")
        max_size_bytes = settings.MAX_VIDEO_UPLOAD_SIZE_MB * 1024 * 1024
        
    # Check if empty
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    sanitized_name = sanitize_filename(original_name)
    stored_name = f"{uuid.uuid4()}{ext}"
    storage_key = f"course-materials/{course_id}/{stored_name}"
    
    # Save stream to storage
    storage = get_storage_provider()
    try:
        bytes_written = await run_in_threadpool(
            storage.save_stream,
            file.file,
            storage_key,
            max_size_bytes
        )
    except FileTooLargeError as e:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Storage operation failed: {str(e)}")
        
    # Database creation
    material = LearningMaterial(
        course_id=course_id,
        uploaded_by=current_user.id,
        title=title or sanitized_name,
        description=description,
        original_filename=sanitized_name,
        stored_filename=stored_name,
        storage_key=storage_key,
        mime_type=file.content_type,
        file_extension=ext,
        size_bytes=bytes_written,
        material_type=material_type,
        visibility=visibility,
        is_downloadable=is_downloadable,
        is_active=True
    )
    
    try:
        db.add(material)
        db.commit()
        db.refresh(material)
    except Exception as db_err:
        db.rollback()
        # Rollback storage operation
        try:
            await run_in_threadpool(storage.delete, storage_key)
        except Exception as cleanup_err:
            logger.error(f"Failed to delete course material file during DB rollback for key {storage_key}: {str(cleanup_err)}")
        logger.error(f"Database transaction failed for course material: {str(db_err)}")
        raise HTTPException(status_code=500, detail="Database record creation failed.")
        
    material.download_url = get_download_url(material)
    return material


@router.post("/lessons/{lesson_id}/materials/upload", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_lesson_material(
    lesson_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    material_type: MaterialType = Form(MaterialType.DOCUMENT),
    visibility: MaterialVisibility = Form(MaterialVisibility.ENROLLED_STUDENTS),
    is_downloadable: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Upload a lesson-level file material.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    course = lesson.course
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this course.")
        
    # File Validation
    original_name = file.filename or "upload"
    ext = os.path.splitext(original_name)[1].lower()
    
    if ext in DISALLOWED_EXTENSIONS or ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Disallowed or unrecognized file type extension.")
        
    if file.content_type not in ALLOWED_TYPES[ext]:
        raise HTTPException(status_code=400, detail="MIME type mismatch for file extension.")
        
    # Size check limits
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if ext in [".mp4", ".mkv"]:
        if not settings.ENABLE_VIDEO_UPLOAD:
            raise HTTPException(status_code=400, detail="Video uploads are currently disabled. Please use video URLs instead.")
        max_size_bytes = settings.MAX_VIDEO_UPLOAD_SIZE_MB * 1024 * 1024
        
    # Check if empty
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    sanitized_name = sanitize_filename(original_name)
    stored_name = f"{uuid.uuid4()}{ext}"
    storage_key = f"course-materials/{course.id}/{stored_name}"
    
    # Save stream to storage
    storage = get_storage_provider()
    try:
        bytes_written = await run_in_threadpool(
            storage.save_stream,
            file.file,
            storage_key,
            max_size_bytes
        )
    except FileTooLargeError as e:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Storage operation failed: {str(e)}")
        
    # Database creation
    material = LearningMaterial(
        course_id=course.id,
        lesson_id=lesson_id,
        uploaded_by=current_user.id,
        title=title or sanitized_name,
        description=description,
        original_filename=sanitized_name,
        stored_filename=stored_name,
        storage_key=storage_key,
        mime_type=file.content_type,
        file_extension=ext,
        size_bytes=bytes_written,
        material_type=material_type,
        visibility=visibility,
        is_downloadable=is_downloadable,
        is_active=True
    )
    
    try:
        db.add(material)
        db.commit()
        db.refresh(material)
    except Exception as db_err:
        db.rollback()
        # Rollback storage operation
        try:
            await run_in_threadpool(storage.delete, storage_key)
        except Exception as cleanup_err:
            logger.error(f"Failed to delete lesson material file during DB rollback for key {storage_key}: {str(cleanup_err)}")
        logger.error(f"Database transaction failed for lesson material: {str(db_err)}")
        raise HTTPException(status_code=500, detail="Database record creation failed.")
        
    material.download_url = get_download_url(material)
    return material


# --- Create external link endpoints ---

class LinkCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    external_url: str
    visibility: MaterialVisibility = MaterialVisibility.ENROLLED_STUDENTS
    is_downloadable: bool = False


@router.post("/courses/{course_id}/materials/link", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_course_link(
    course_id: int,
    link_in: LinkCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Create a course-level external link learning material.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this course.")
        
    validate_external_url(link_in.external_url)
        
    material = LearningMaterial(
        course_id=course_id,
        uploaded_by=current_user.id,
        title=link_in.title,
        description=link_in.description,
        original_filename="Link",
        external_url=link_in.external_url,
        material_type=MaterialType.EXTERNAL_LINK,
        visibility=link_in.visibility,
        is_downloadable=False,
        is_active=True
    )
    
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.post("/lessons/{lesson_id}/materials/link", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_lesson_link(
    lesson_id: int,
    link_in: LinkCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Create a lesson-level external link learning material.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    course = lesson.course
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this course.")
        
    validate_external_url(link_in.external_url)
        
    material = LearningMaterial(
        course_id=course.id,
        lesson_id=lesson_id,
        uploaded_by=current_user.id,
        title=link_in.title,
        description=link_in.description,
        original_filename="Link",
        external_url=link_in.external_url,
        material_type=MaterialType.EXTERNAL_LINK,
        visibility=link_in.visibility,
        is_downloadable=False,
        is_active=True
    )
    
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


# --- Update / Archive / Delete endpoints ---

@router.get("/materials/{material_id}", response_model=MaterialResponse)
def get_material_metadata(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve single material metadata.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    check_material_action_allowed(material, "view", current_user, db)
        
    material.download_url = get_download_url(material)
    return material


@router.patch("/materials/{material_id}", response_model=MaterialResponse)
def update_material_metadata(
    material_id: int,
    material_in: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Update material metadata (title, description, visibility, is_downloadable).
    Only the course owner or admin can update it.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    check_material_action_allowed(material, "edit", current_user, db)
        
    update_data = material_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)
        
    db.add(material)
    db.commit()
    db.refresh(material)
    material.download_url = get_download_url(material)
    return material


@router.post("/materials/{material_id}/archive", response_model=MaterialResponse)
def archive_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
) -> Any:
    """
    Archive a material (soft delete by setting is_active = False).
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    check_material_action_allowed(material, "archive", current_user, db)
        
    material.is_active = False
    db.add(material)
    db.commit()
    db.refresh(material)
    material.download_url = get_download_url(material)
    return material


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin)
):
    """
    Hard delete a learning material. Only administrators can perform this action.
    - Physical delete from storage must succeed first.
    - Only then is database metadata deleted.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    check_material_action_allowed(material, "permanent_delete", current_user, db)
        
    # Check if file has storage
    if material.material_type != MaterialType.EXTERNAL_LINK and material.storage_key:
        storage = get_storage_provider()
        
        # Verify and perform physical delete first
        try:
            exists = await run_in_threadpool(storage.exists, material.storage_key)
            if exists:
                await run_in_threadpool(storage.delete, material.storage_key)
        except Exception as e:
            # Log failure clearly without exposing absolute storage path
            logger.error(f"Failed to delete storage object for key {material.storage_key}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Physical file deletion failed. Database metadata remains untouched."
            )
             
    db.delete(material)
    db.commit()
    return


# --- File Downloader and Preview Streamers ---

@router.get("/materials/{material_id}/download")
async def download_material_file(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Stream download the physical file for a material with visibility/downloadable checks.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    if material.material_type == MaterialType.EXTERNAL_LINK:
        raise HTTPException(status_code=400, detail="Cannot download an external link material.")
        
    # Action check validates visibility, active status, enrollment and is_downloadable flag
    check_material_action_allowed(material, "download", current_user, db)
                
    storage = get_storage_provider()
    
    # Check if physical file exists
    try:
        file_exists = await run_in_threadpool(storage.exists, material.storage_key)
    except Exception:
        file_exists = False
        
    if not file_exists:
        raise HTTPException(status_code=404, detail="Physical file not found in storage.")
        
    def chunk_generator():
        # Open generator from local storage provider
        stream_gen = storage.open_stream(material.storage_key)
        try:
            for chunk in stream_gen:
                yield chunk
        finally:
            if hasattr(stream_gen, "close"):
                stream_gen.close()
                
    filename_encoded = urllib.parse.quote(material.original_filename)
    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{filename_encoded}"
    }
    
    return StreamingResponse(
        chunk_generator(),
        media_type=material.mime_type or "application/octet-stream",
        headers=headers
    )


@router.get("/materials/{material_id}/stream")
async def stream_material_file(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Stream the physical file content inline for in-browser rendering (safe MIME types only: PDF, images).
    Does not check is_downloadable, but enforces same enrollment/visibility/active statuses.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    if material.material_type == MaterialType.EXTERNAL_LINK:
        raise HTTPException(status_code=400, detail="Cannot stream an external link material.")
        
    # Action check validates active status, visibility, enrollment and preview-safe MIME types
    check_material_action_allowed(material, "stream", current_user, db)
                
    storage = get_storage_provider()
    
    # Check if physical file exists
    try:
        file_exists = await run_in_threadpool(storage.exists, material.storage_key)
    except Exception:
        file_exists = False
        
    if not file_exists:
        raise HTTPException(status_code=404, detail="Physical file not found in storage.")
        
    def chunk_generator():
        stream_gen = storage.open_stream(material.storage_key)
        try:
            for chunk in stream_gen:
                yield chunk
        finally:
            if hasattr(stream_gen, "close"):
                stream_gen.close()
                
    filename_encoded = urllib.parse.quote(material.original_filename)
    headers = {
        "Content-Disposition": f"inline; filename*=UTF-8''{filename_encoded}"
    }
    
    return StreamingResponse(
        chunk_generator(),
        media_type=material.mime_type or "application/octet-stream",
        headers=headers
    )
