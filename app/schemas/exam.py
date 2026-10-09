from typing import List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel, Field

class GovtExamBase(BaseModel):
    title_en: str
    title_ta: str
    title_hi: Optional[str] = None
    conducting_body: str
    post_name: str
    level: str = "central"
    state: str = "All India"
    category: str = "Civil Services"
    qualification: str = "Any Degree / Graduate"
    age_limit: str = "21 - 32 years"
    total_vacancies: str = "Various"
    salary_scale: Optional[str] = None
    application_fee: Optional[str] = None
    start_date: Optional[date] = None
    deadline: date
    exam_date: Optional[str] = None
    official_portal_url: str
    notification_pdf_url: Optional[str] = None
    selection_process: List[str] = []
    description_en: str
    description_ta: Optional[str] = None
    description_hi: Optional[str] = None
    active: bool = True

class GovtExamRead(GovtExamBase):
    id: int

    class Config:
        from_attributes = True

class ReminderCreate(BaseModel):
    device_id: str
    item_type: str  # 'scheme' or 'exam'
    item_id: int
    title: str
    deadline: date
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None

class ReminderRead(BaseModel):
    id: int
    device_id: str
    item_type: str
    item_id: int
    title: str
    deadline: date
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UpcomingDeadlineItem(BaseModel):
    id: int
    type: str  # 'scheme' or 'exam'
    title_en: str
    title_ta: str
    title_hi: Optional[str] = None
    level: str
    state: str
    category: str
    deadline: date
    days_left: int
    urgency: str  # 'critical' (<=3 days), 'warning' (4-7 days), 'upcoming' (8-30 days)
    official_url: str
    highlight_badge: str  # e.g., '1,056 Posts' or '₹1,000 / month'

class DeadlineSummaryResponse(BaseModel):
    total_upcoming: int
    critical_count: int
    warning_count: int
    schemes_count: int
    exams_count: int
    critical_items: List[UpcomingDeadlineItem]
    days_window: int = 30

