from typing import Any, Dict, List, Optional
from datetime import date
from pydantic import BaseModel, Field

class DocumentBase(BaseModel):
    name_en: str
    name_ta: str
    name_hi: Optional[str] = None
    how_to_get_en: str
    how_to_get_ta: str
    how_to_get_hi: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentRead(DocumentBase):
    id: int

    class Config:
        from_attributes = True

class RuleSchema(BaseModel):
    field: str
    op: str
    value: Any
    label_en: Optional[str] = None
    label_ta: Optional[str] = None
    label_hi: Optional[str] = None

class SchemeBase(BaseModel):
    name_en: str
    name_ta: str
    name_hi: Optional[str] = None
    level: str = "state"
    state: str = "Tamil Nadu"
    category: str = "Education"
    benefit_amount: float = 0.0
    benefit_text: str
    description_en: str
    description_ta: str
    description_hi: Optional[str] = None
    deadline: Optional[date] = None
    official_url: str
    apply_steps: List[str] = []
    rules: List[Dict[str, Any]] = []
    active: bool = True

class SchemeCreate(SchemeBase):
    document_ids: List[int] = []

class SchemeUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ta: Optional[str] = None
    name_hi: Optional[str] = None
    level: Optional[str] = None
    state: Optional[str] = None
    category: Optional[str] = None
    benefit_amount: Optional[float] = None
    benefit_text: Optional[str] = None
    description_en: Optional[str] = None
    description_ta: Optional[str] = None
    description_hi: Optional[str] = None
    deadline: Optional[date] = None
    official_url: Optional[str] = None
    apply_steps: Optional[List[str]] = None
    rules: Optional[List[Dict[str, Any]]] = None
    document_ids: Optional[List[int]] = None
    active: Optional[bool] = None

class SchemeRead(SchemeBase):
    id: int
    last_verified: date
    documents: List[DocumentRead] = []

    class Config:
        from_attributes = True
