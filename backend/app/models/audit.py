from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_type = Column(String, nullable=False, index=True)
    target_id = Column(String, nullable=True, index=True)
    result = Column(String, nullable=False, index=True, default="success")  # success | failure
    sanitized_details = Column(JSON, nullable=True)
    request_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    actor = relationship("User", foreign_keys=[actor_id])

    __table_args__ = (
        Index("ix_audit_logs_target_type_id", "target_type", "target_id"),
    )
