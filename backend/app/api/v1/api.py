from fastapi import APIRouter
from app.api.v1.endpoints import auth, courses, lessons, progress, admin, materials

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(lessons.router, tags=["lessons"])
api_router.include_router(materials.router, tags=["materials"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
