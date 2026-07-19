from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import engine
from app.models import Base

# Create database tables on startup (as a local development fallback) if enabled
try:
    if settings.AUTO_CREATE_TABLES or str(engine.url).startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"Could not auto-create database tables on startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend API for SmartLearn LMS — AI-powered Learning, Revision, and Online Exam Platform"
)

# CORS Configuration
# Allow local dev origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root_endpoint():
    """Simple status check for the API root."""
    return {
        "status": "online",
        "message": f"Welcome to the {settings.PROJECT_NAME} API. Access API docs at /docs."
    }
