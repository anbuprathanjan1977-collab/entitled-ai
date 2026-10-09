from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Scheme
from app.schemas.scheme import SchemeRead
from app.seed.districts import TAMIL_NADU_DISTRICTS
from app.seed.states import ALL_INDIAN_STATES, STATE_DISTRICTS

router = APIRouter(prefix="/api", tags=["Schemes"])

@router.get("/states")
def get_states():
    """Returns all 28 States and 8 Union Territories of India."""
    return ALL_INDIAN_STATES

@router.get("/districts")
def get_districts(state: Optional[str] = Query(None, description="Optional State filter")):
    """Returns districts list for specified state, defaults to Tamil Nadu 38 districts."""
    if not state or state.lower() in ["tamil nadu", "tn"]:
        return TAMIL_NADU_DISTRICTS
    
    # Check if we have specific state districts
    for s_name, d_list in STATE_DISTRICTS.items():
        if s_name.lower() == state.lower():
            return d_list

    # Generic district fallback
    return [
        {"en": f"{state} District 1", "ta": f"{state} மாவட்டம் 1", "hi": f"{state} जिला 1"},
        {"en": f"{state} District 2", "ta": f"{state} மாவட்டம் 2", "hi": f"{state} जिला 2"}
    ]

@router.get("/schemes", response_model=List[SchemeRead])
def list_schemes(
    category: Optional[str] = None,
    level: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lists active schemes with full filtering support:
    - category (Education, Women, Agriculture, Healthcare, Scholarship, etc.)
    - level (central / state)
    - state (Tamil Nadu, Karnataka, All India, etc.)
    - search (searches names, descriptions, and benefits)
    """
    query = db.query(Scheme).filter(Scheme.active == True)
    
    if category and category.lower() != 'all':
        query = query.filter(Scheme.category.ilike(f"%{category}%"))
    
    if level and level.lower() != 'all':
        query = query.filter(Scheme.level.ilike(level))

    if state and state.lower() != 'all':
        # Match schemes specific to this state OR All India schemes
        query = query.filter(or_(
            Scheme.state.ilike(f"%{state}%"),
            Scheme.state.ilike("%all india%")
        ))

    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(
            Scheme.name_en.ilike(search_term),
            Scheme.name_ta.ilike(search_term),
            Scheme.description_en.ilike(search_term),
            Scheme.description_ta.ilike(search_term),
            Scheme.benefit_text.ilike(search_term)
        ))

    return query.all()

@router.get("/schemes/{scheme_id}", response_model=SchemeRead)
def get_scheme(scheme_id: int, db: Session = Depends(get_db)):
    """Fetches full scheme details including documents and apply steps."""
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )
    return scheme
