from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Scheme
from app.schemas.admin import ExplainRequest, ExplainResponse
from app.services.llm_service import generate_scheme_explanation

router = APIRouter(prefix="/api", tags=["AI Explanation"])

@router.post("/explain", response_model=ExplainResponse)
async def explain_scheme(req: ExplainRequest, db: Session = Depends(get_db)):
    """
    Returns a 3-line plain-language summary strictly using stored database facts.
    Guarded against hallucinations, invent-amounts, and eligibility assumptions.
    Cached per scheme and language.
    """
    scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found"
        )

    explanation, was_cached = await generate_scheme_explanation(scheme, req.language)

    return ExplainResponse(
        scheme_id=scheme.id,
        language=req.language,
        explanation=explanation,
        cached=was_cached
    )
