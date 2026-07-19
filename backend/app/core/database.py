from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

import os
import logging

logger = logging.getLogger(__name__)

db_uri = settings.SQLALCHEMY_DATABASE_URI

def create_db_engine(uri: str):
    if uri.startswith("sqlite"):
        return create_engine(uri, connect_args={"check_same_thread": False})
    return create_engine(uri, pool_pre_ping=True)

try:
    engine = create_db_engine(db_uri)
    # Test connection on startup
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Could not connect to primary database ({db_uri}): {e}")
    logger.warning("Falling back to local SQLite database: sqlite:///./smartlearn.db")
    db_uri = "sqlite:///./smartlearn.db"
    engine = create_db_engine(db_uri)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """
    Dependency generator for DB sessions.
    Ensures the session is closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
