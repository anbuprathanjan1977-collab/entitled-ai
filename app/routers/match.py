from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Scheme
from app.schemas.profile import Profile, FamilyMatchRequest, WhatIfRequest
from app.schemas.scheme import SchemeRead
from app.schemas.match import (
    MatchSchemeItem, MatchResponse, FamilyMatchResponse, 
    FamilyMemberResult, FamilySummary, WhatIfResponse
)
from app.engine.rule_evaluator import evaluate_scheme, calculate_verified_status
from app.engine.ranker import calculate_rank_score

router = APIRouter(prefix="/api", tags=["Eligibility & Matching"])

def match_schemes_for_profile(schemes: List[Scheme], profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    eligible_items = []
    almost_eligible_items = []

    for scheme in schemes:
        eval_res = evaluate_scheme(scheme.rules or [], profile_dict)
        rank_score = calculate_rank_score(
            benefit_amount=scheme.benefit_amount,
            deadline=scheme.deadline,
            document_count=len(scheme.documents)
        )
        verified_status = calculate_verified_status(scheme.last_verified)

        item = MatchSchemeItem(
            scheme=SchemeRead.model_validate(scheme),
            match_percent=eval_res.match_percent,
            rank_score=rank_score,
            verified_status=verified_status,
            failed_reasons=eval_res.failed_reasons
        )

        if eval_res.is_eligible:
            eligible_items.append(item)
        elif eval_res.is_almost_eligible:
            almost_eligible_items.append(item)

    # Top picks sorted by ranking score descending
    top_picks = sorted(eligible_items, key=lambda x: x.rank_score["total"], reverse=True)

    total_benefit = sum(item.scheme.benefit_amount for item in eligible_items)

    return {
        "eligible": eligible_items,
        "almost_eligible": almost_eligible_items,
        "top_picks": top_picks,
        "total_eligible_benefit": total_benefit,
        "total_eligible_count": len(eligible_items)
    }

@router.post("/match", response_model=MatchResponse)
def match_profile(profile: Profile, db: Session = Depends(get_db)):
    """
    Evaluates in-memory profile against all active schemes.
    Does NOT store user answers in any database.
    """
    schemes = db.query(Scheme).filter(Scheme.active == True).all()
    profile_dict = profile.model_dump(exclude_none=True)
    results = match_schemes_for_profile(schemes, profile_dict)
    return MatchResponse(**results)

@router.post("/match/family", response_model=FamilyMatchResponse)
def match_family(req: FamilyMatchRequest, db: Session = Depends(get_db)):
    """
    Matches welfare schemes for multiple family members sharing household income.
    Returns per-member eligibility plus collective family benefit summary.
    """
    schemes = db.query(Scheme).filter(Scheme.active == True).all()

    member_results: List[FamilyMemberResult] = []
    unique_eligible_scheme_ids = set()
    total_family_benefit = 0.0

    for m in req.members:
        # Synthesize combined profile
        m_profile = {
            "family_income": req.family_income,
            "state": req.state or "Tamil Nadu",
            "district": req.district,
            "age": m.age,
            "gender": m.gender,
            "community": m.community,
            "education": m.education,
            "first_graduate": m.first_graduate,
        }
        res = match_schemes_for_profile(schemes, m_profile)
        for item in res["eligible"]:
            unique_eligible_scheme_ids.add(item.scheme.id)
            total_family_benefit += item.scheme.benefit_amount

        member_results.append(
            FamilyMemberResult(
                member=m,
                eligible=res["eligible"],
                almost_eligible=res["almost_eligible"],
                total_benefit=res["total_eligible_benefit"]
            )
        )

    summary = FamilySummary(
        total_schemes=len(unique_eligible_scheme_ids),
        total_estimated_annual_benefit=total_family_benefit,
        member_count=len(req.members)
    )

    return FamilyMatchResponse(
        family_summary=summary,
        members=member_results
    )

@router.post("/whatif", response_model=WhatIfResponse)
def what_if_simulation(req: WhatIfRequest, db: Session = Depends(get_db)):
    """
    Simulates changes to income, education or qualifications.
    Returns newly eligible and newly lost schemes.
    """
    schemes = db.query(Scheme).filter(Scheme.active == True).all()

    orig_profile = req.profile.model_dump(exclude_none=True)
    orig_res = match_schemes_for_profile(schemes, orig_profile)
    orig_eligible_map = {item.scheme.id: item for item in orig_res["eligible"]}

    # Apply what-if adjustments
    updated_profile = dict(orig_profile)
    updated_profile.update(req.changes)

    updated_res = match_schemes_for_profile(schemes, updated_profile)
    updated_eligible_map = {item.scheme.id: item for item in updated_res["eligible"]}

    newly_eligible = [
        item for s_id, item in updated_eligible_map.items()
        if s_id not in orig_eligible_map
    ]

    newly_lost = [
        item for s_id, item in orig_eligible_map.items()
        if s_id not in updated_eligible_map
    ]

    return WhatIfResponse(
        newly_eligible=newly_eligible,
        newly_lost=newly_lost,
        original_eligible_count=len(orig_res["eligible"]),
        updated_eligible_count=len(updated_res["eligible"]),
        original_total_benefit=orig_res["total_eligible_benefit"],
        updated_total_benefit=updated_res["total_eligible_benefit"]
    )
