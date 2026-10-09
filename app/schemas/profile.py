from typing import Any, Dict, List, Optional
from datetime import date
from pydantic import BaseModel, Field

class Profile(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    family_income: Optional[float] = None
    community: Optional[str] = None
    education: Optional[str] = None
    first_graduate: Optional[bool] = False
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = None

class FamilyMemberProfile(BaseModel):
    id: Optional[str] = None
    name: str
    relationship: str
    age: int
    gender: str
    community: Optional[str] = None
    education: Optional[str] = None
    first_graduate: Optional[bool] = False

class FamilyMatchRequest(BaseModel):
    family_income: float
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = None
    members: List[FamilyMemberProfile]

class WhatIfRequest(BaseModel):
    profile: Profile
    changes: Dict[str, Any]
