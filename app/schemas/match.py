from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.schemas.scheme import SchemeRead
from app.schemas.profile import FamilyMemberProfile

class MatchSchemeItem(BaseModel):
    scheme: SchemeRead
    match_percent: float
    rank_score: Dict[str, Any]
    verified_status: str
    failed_reasons: List[Dict[str, Any]] = []

class MatchResponse(BaseModel):
    eligible: List[MatchSchemeItem]
    almost_eligible: List[MatchSchemeItem]
    top_picks: List[MatchSchemeItem]
    total_eligible_benefit: float
    total_eligible_count: int

class FamilyMemberResult(BaseModel):
    member: FamilyMemberProfile
    eligible: List[MatchSchemeItem]
    almost_eligible: List[MatchSchemeItem]
    total_benefit: float

class FamilySummary(BaseModel):
    total_schemes: int
    total_estimated_annual_benefit: float
    member_count: int

class FamilyMatchResponse(BaseModel):
    family_summary: FamilySummary
    members: List[FamilyMemberResult]

class WhatIfResponse(BaseModel):
    newly_eligible: List[MatchSchemeItem]
    newly_lost: List[MatchSchemeItem]
    original_eligible_count: int
    updated_eligible_count: int
    original_total_benefit: float
    updated_total_benefit: float
