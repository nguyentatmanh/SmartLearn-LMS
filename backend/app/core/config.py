import os
from typing import Any, Dict, Optional
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartLearn LMS"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-smartlearn-lms-development-only")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Short-lived access token as requested
    AUTO_CREATE_TABLES: bool = False
    
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    STORAGE_BACKEND: str = "local"
    UPLOAD_ROOT: str = "/workspace/uploads"
    MAX_UPLOAD_SIZE_MB: int = 30
    ENABLE_VIDEO_UPLOAD: bool = False
    MAX_VIDEO_UPLOAD_SIZE_MB: int = 500

    S3_ENDPOINT: Optional[str] = None
    S3_BUCKET: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_REGION: Optional[str] = None
    S3_USE_SSL: bool = True

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "SmartLearn LMS"
    SMTP_USE_TLS: bool = True

    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "smartlearn_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], values: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        
        # Build from individual components
        # In Pydantic v2, values is a ValidationInfo object or a dict. 
        # Using simple env overrides is safer:
        postgres_user = os.getenv("POSTGRES_USER", "postgres")
        postgres_password = os.getenv("POSTGRES_PASSWORD", "postgres")
        postgres_server = os.getenv("POSTGRES_SERVER", "db")
        postgres_port = os.getenv("POSTGRES_PORT", "5432")
        postgres_db = os.getenv("POSTGRES_DB", "smartlearn_db")
        
        return f"postgresql://{postgres_user}:{postgres_password}@{postgres_server}:{postgres_port}/{postgres_db}"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()
