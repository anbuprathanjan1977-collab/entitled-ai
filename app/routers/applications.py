from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Application, Scheme
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationRead, ReminderItem
)
from app.schemas.scheme import SchemeRead

router = APIRouter(prefix="/api", tags=["Applications & Reminders"])

@router.post("/applications", response_model=ApplicationRead)
def track_application(req: ApplicationCreate, db: Session = Depends(get_db)):
    """
    Records or updates anonymous scheme application status for a given device_id.
    Valid statuses: 'applied', 'pending', 'received'.
    """
    scheme = db.query(Scheme).filter(Scheme.id == req.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    app_record = db.query(Application).filter(
        Application.device_id == req.device_id,
        Application.scheme_id == req.scheme_id
    ).first()

    if app_record:
        app_record.status = req.status
        app_record.updated_at = datetime.utcnow()
    else:
        app_record = Application(
            device_id=req.device_id,
            scheme_id=req.scheme_id,
            status=req.status,
            updated_at=datetime.utcnow()
        )
        db.add(app_record)

    db.commit()
    db.refresh(app_record)
    return app_record

@router.get("/applications", response_model=List[ApplicationRead])
def list_applications(
    device_id: str = Query(..., description="Anonymous client device UUID"),
    db: Session = Depends(get_db)
):
    """Fetches all tracked schemes for the anonymous device_id."""
    return db.query(Application).filter(Application.device_id == device_id).all()

@router.patch("/applications/{app_id}", response_model=ApplicationRead)
def update_application_status(
    app_id: int,
    req: ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Updates status of a tracked scheme application (applied, pending, received)."""
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    app_record.status = req.status
    app_record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app_record)
    return app_record

@router.get("/reminders/upcoming", response_model=List[ReminderItem])
def get_upcoming_reminders(
    device_id: str = Query(..., description="Anonymous client device UUID"),
    db: Session = Depends(get_db)
):
    """
    Returns tracked schemes that have a deadline within the next 14 days.
    Useful for in-app alert banners and priority alerts.
    """
    today = date.today()
    cutoff = today + timedelta(days=14)

    tracked = db.query(Application).filter(
        Application.device_id == device_id,
        Application.status.in_(["pending", "applied"])
    ).all()

    reminders = []
    for app in tracked:
        scheme = app.scheme
        if scheme and scheme.deadline:
            days_left = (scheme.deadline - today).days
            if 0 <= days_left <= 14:
                urgency = "critical" if days_left <= 3 else "high"
                reminders.append(
                    ReminderItem(
                        application_id=app.id,
                        scheme_id=scheme.id,
                        scheme_name_en=scheme.name_en,
                        scheme_name_ta=scheme.name_ta,
                        scheme_name_hi=scheme.name_hi,
                        status=app.status,
                        deadline=scheme.deadline,
                        days_left=days_left,
                        urgency=urgency
                    )
                )

    reminders.sort(key=lambda r: r.days_left)
    return reminders
