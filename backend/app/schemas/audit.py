from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    event_type: str
    actor_id: Optional[int] = None
    target_type: str
    target_id: Optional[str] = None
    result: str
    sanitized_details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
