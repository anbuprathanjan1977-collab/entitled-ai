from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Admin, Scheme, Document, ChangeEvent
from app.schemas.admin import AdminLogin, TokenResponse, ChangeEventRead
from app.schemas.scheme import SchemeCreate, SchemeUpdate, SchemeRead, DocumentRead, DocumentCreate
from app.services.auth_service import verify_password, create_access_token, decode_access_token
from app.services.policy_checker import check_all_sources, simulate_demo_policy_change

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Admin:
    """Dependency verifying JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    admin = db.query(Admin).filter(Admin.email == payload["sub"]).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin user not found"
        )
    return admin

@router.post("/login", response_model=TokenResponse)
def login_admin(creds: AdminLogin, db: Session = Depends(get_db)):
    """Authenticates admin and returns JWT token."""
    admin = db.query(Admin).filter(Admin.email == creds.email).first()
    if not admin or not verify_password(creds.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": admin.email})
    return TokenResponse(access_token=token, email=admin.email)

# --- Scheme CRUD ---

@router.get("/schemes", response_model=List[SchemeRead])
def admin_list_schemes(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists all schemes including active and inactive."""
    return db.query(Scheme).all()

@router.post("/schemes", response_model=SchemeRead, status_code=status.HTTP_201_CREATED)
def admin_create_scheme(
    scheme_in: SchemeCreate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Creates a new scheme with rules and linked documents."""
    data = scheme_in.model_dump(exclude={"document_ids"})
    scheme = Scheme(**data, last_verified=date.today())

    if scheme_in.document_ids:
        docs = db.query(Document).filter(Document.id.in_(scheme_in.document_ids)).all()
        scheme.documents = docs

    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return scheme

@router.put("/schemes/{scheme_id}", response_model=SchemeRead)
def admin_update_scheme(
    scheme_id: int,
    scheme_in: SchemeUpdate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Updates scheme details, rules, or document associations."""
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    update_data = scheme_in.model_dump(exclude_unset=True, exclude={"document_ids"})
    for key, value in update_data.items():
        setattr(scheme, key, value)

    if scheme_in.document_ids is not None:
        docs = db.query(Document).filter(Document.id.in_(scheme_in.document_ids)).all()
        scheme.documents = docs

    db.commit()
    db.refresh(scheme)
    return scheme

@router.delete("/schemes/{scheme_id}")
def admin_delete_scheme(
    scheme_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deletes a scheme from catalog."""
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    db.delete(scheme)
    db.commit()
    return {"message": f"Scheme {scheme_id} deleted successfully"}

# --- Documents CRUD ---

@router.get("/documents", response_model=List[DocumentRead])
def admin_list_documents(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(Document).all()

@router.post("/documents", response_model=DocumentRead)
def admin_create_document(
    doc_in: DocumentCreate,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    doc = Document(**doc_in.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

# --- Policy Changes ---

@router.get("/changes", response_model=List[ChangeEventRead])
def list_change_events(
    status_filter: Optional[str] = None,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists policy change events detected by automated crawlers."""
    query = db.query(ChangeEvent)
    if status_filter:
        query = query.filter(ChangeEvent.status == status_filter)
    events = query.order_by(ChangeEvent.detected_at.desc()).all()

    results = []
    for ev in events:
        scheme_name = ev.scheme.name_en if ev.scheme else "Unknown"
        scheme_ta = ev.scheme.name_ta if ev.scheme else ""
        results.append(
            ChangeEventRead(
                id=ev.id,
                scheme_id=ev.scheme_id,
                scheme_name_en=scheme_name,
                scheme_name_ta=scheme_ta,
                old_text=ev.old_text,
                new_text=ev.new_text,
                diff=ev.diff,
                ai_summary=ev.ai_summary,
                status=ev.status,
                detected_at=ev.detected_at
            )
        )
    return results

@router.post("/changes/{change_id}/approve")
def approve_policy_change(
    change_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approves change event.
    CRITICAL: Updates the scheme's last_verified date to today!
    """
    event = db.query(ChangeEvent).filter(ChangeEvent.id == change_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Change event not found")

    event.status = "approved"
    if event.scheme:
        event.scheme.last_verified = date.today()

    db.commit()
    return {
        "message": f"Change event {change_id} approved. Scheme last_verified updated to {date.today()}.",
        "status": "approved"
    }

@router.post("/changes/{change_id}/reject")
def reject_policy_change(
    change_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Rejects change event without altering scheme data."""
    event = db.query(ChangeEvent).filter(ChangeEvent.id == change_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Change event not found")

    event.status = "rejected"
    db.commit()
    return {"message": f"Change event {change_id} marked as rejected.", "status": "rejected"}

@router.post("/check-now")
async def trigger_immediate_check(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Triggers crawler scan across all registered scheme portals."""
    detected = await check_all_sources(db)
    return {
        "message": f"Scan completed across portals.",
        "changes_detected_count": len(detected)
    }

@router.post("/demo-simulate-change")
def trigger_demo_change_simulation(
    scheme_id: Optional[int] = None,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Simulates a live policy amendment event for Hackathon demonstration."""
    event = simulate_demo_policy_change(db, scheme_id)
    return {
        "message": "Simulated live policy amendment created successfully.",
        "change_id": event.id,
        "scheme_id": event.scheme_id,
        "ai_summary": event.ai_summary
    }
