from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ChangeEventRead(BaseModel):
    id: int
    scheme_id: int
    scheme_name_en: Optional[str] = None
    scheme_name_ta: Optional[str] = None
    old_text: str
    new_text: str
    diff: str
    ai_summary: str
    status: str
    detected_at: datetime

    class Config:
        from_attributes = True

class AdminLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

class ExplainRequest(BaseModel):
    scheme_id: int
    language: str = "ta"  # ta, en, hi

class ExplainResponse(BaseModel):
    scheme_id: int
    language: str
    explanation: str
    cached: bool = False

class OCRResponse(BaseModel):
    name: Optional[str] = None
    community: Optional[str] = None
    family_income: Optional[float] = None
    certificate_type: Optional[str] = None
    confidence: float
    raw_extracted_text: Optional[str] = None
