from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import engine
from app.models import Base

# Create database tables on startup (as a local development fallback) if enabled
if settings.AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend API for SmartLearn LMS — AI-powered Learning, Revision, and Online Exam Platform"
)

# CORS Configuration
# Adjust origins in production. Standard development origin is localhost:3000.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
