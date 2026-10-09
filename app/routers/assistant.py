from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Scheme
from app.services.llm_service import generate_chat_response

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    scheme_id: Optional[int] = None
    history: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    reply: str
    category: str = "general"
    suggested_questions: List[str] = []

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Conversational AI Assistant for Indian welfare schemes and e-Sevai guidance.
    Answers scheme questions, document guidance (Aadhaar, PAN, certificates), steps, and eligibility.
    Always returns a helpful response without hallucinating or crashing.
    """
    scheme = None
    if req.scheme_id:
        scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()

    res = await generate_chat_response(
        message=req.message,
        language=req.language,
        context_scheme=scheme,
        history=req.history
    )

    return ChatResponse(**res)
