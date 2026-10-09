from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel
from app.schemas.scheme import SchemeRead

class ApplicationCreate(BaseModel):
    device_id: str
    scheme_id: int
    status: str = "pending"  # applied, pending, received

class ApplicationUpdate(BaseModel):
    status: str

class ApplicationRead(BaseModel):
    id: int
    device_id: str
    scheme_id: int
    status: str
    updated_at: datetime
    scheme: Optional[SchemeRead] = None

    class Config:
        from_attributes = True

class ReminderItem(BaseModel):
    application_id: int
    scheme_id: int
    scheme_name_en: str
    scheme_name_ta: str
    scheme_name_hi: Optional[str] = None
    status: str
    deadline: date
    days_left: int
    urgency: str  # high, medium, critical
