from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import GovtExam, Scheme, UserReminder
from app.schemas.exam import (
    GovtExamRead, ReminderCreate, ReminderRead, UpcomingDeadlineItem, DeadlineSummaryResponse
)

router = APIRouter(tags=["Govt Jobs & Exams & Reminders"])

@router.get("/api/exams", response_model=List[GovtExamRead])
def list_govt_exams(
    search: Optional[str] = Query(None, description="Search by post, title, or conducting body"),
    level: Optional[str] = Query(None, description="Filter by level: central or state"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    qualification: Optional[str] = Query(None, description="Filter by qualification (10th, 12th, Graduate, etc.)"),
    category: Optional[str] = Query(None, description="Filter by category (Civil Services, Railways, Banking, etc.)"),
    closing_soon: Optional[bool] = Query(False, description="Filter exams closing in next 10 days"),
    sort_by: Optional[str] = Query("deadline_asc", description="Sort by: deadline_asc, vacancies_desc, or latest"),
    db: Session = Depends(get_db)
):
    query = db.query(GovtExam).filter(GovtExam.active == True)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                GovtExam.title_en.ilike(search_filter),
                GovtExam.title_ta.ilike(search_filter),
                GovtExam.conducting_body.ilike(search_filter),
                GovtExam.post_name.ilike(search_filter),
                GovtExam.category.ilike(search_filter),
                GovtExam.qualification.ilike(search_filter),
                GovtExam.description_en.ilike(search_filter)
            )
        )

    if level and level.lower() != "all":
        query = query.filter(GovtExam.level.ilike(level.strip()))

    if state and state.lower() != "all" and state.lower() != "all india":
        query = query.filter(
            or_(
                GovtExam.state.ilike(state.strip()),
                GovtExam.state == "All India"
            )
        )

    if qualification and qualification.lower() != "all":
        qual_term = qualification.strip().lower()
        if "10th" in qual_term:
            query = query.filter(or_(
                GovtExam.qualification.ilike("%10th%"),
                GovtExam.qualification.ilike("%sslc%"),
                GovtExam.qualification.ilike("%matriculation%")
            ))
        elif "12th" in qual_term:
            query = query.filter(or_(
                GovtExam.qualification.ilike("%12th%"),
                GovtExam.qualification.ilike("%puc%"),
                GovtExam.qualification.ilike("%higher secondary%")
            ))
        elif "graduate" in qual_term or "degree" in qual_term:
            query = query.filter(or_(
                GovtExam.qualification.ilike("%graduate%"),
                GovtExam.qualification.ilike("%degree%")
            ))
        elif "diploma" in qual_term or "iti" in qual_term:
            query = query.filter(or_(
                GovtExam.qualification.ilike("%diploma%"),
                GovtExam.qualification.ilike("%iti%")
            ))
        else:
            query = query.filter(GovtExam.qualification.ilike(f"%{qualification.strip()}%"))

    if category and category.lower() != "all":
        query = query.filter(GovtExam.category.ilike(f"%{category.strip()}%"))

    if closing_soon:
        today = date.today()
        ten_days_later = today + timedelta(days=10)
        query = query.filter(GovtExam.deadline >= today, GovtExam.deadline <= ten_days_later)

    return query.order_by(GovtExam.deadline.asc()).all()


@router.get("/api/exams/portals")
def get_official_portals_directory():
    """
    Returns verified official Central & State government job application portals
    with direct application URLs, conducting body details, and helpline info.
    """
    return [
        {
            "name": "TNPSC Official Portal",
            "body": "TNPSC",
            "level": "State (Tamil Nadu)",
            "url": "https://apply.tnpscexams.in",
            "description": "One-Time Registration (OTR), hall tickets, Group 1, 2, 4 & VAO online applications.",
            "category": "State Civil Services",
            "badge": "Tamil Nadu"
        },
        {
            "name": "TNUSRB Police Recruitment Portal",
            "body": "TNUSRB",
            "level": "State (Tamil Nadu)",
            "url": "https://www.tnusrb.tn.gov.in",
            "description": "Online application portal for Tamil Nadu Police Constables, Sub-Inspectors & Firemen.",
            "category": "Uniformed Police Services",
            "badge": "Tamil Nadu"
        },
        {
            "name": "UPSC Online Portal (OTR)",
            "body": "UPSC",
            "level": "Central (All India)",
            "url": "https://upsconline.nic.in",
            "description": "Union Public Service Commission One-Time Registration for Civil Services (IAS/IPS), NDA & CDS.",
            "category": "Central Civil & Defense",
            "badge": "Central Govt"
        },
        {
            "name": "SSC Central Application Portal",
            "body": "SSC",
            "level": "Central (All India)",
            "url": "https://ssc.gov.in",
            "description": "Staff Selection Commission portal for CGL, CHSL, MTS, and GD Paramilitary Constable exams.",
            "category": "Central Staff Selection",
            "badge": "Central Govt"
        },
        {
            "name": "RRB Apply (Indian Railways)",
            "body": "RRB",
            "level": "Central (All India)",
            "url": "https://rrbapply.gov.in",
            "description": "Centralized Railway Recruitment Board portal for NTPC, ALP, Group D, and Technical staff.",
            "category": "Indian Railways",
            "badge": "Railways"
        },
        {
            "name": "IBPS Online Examination Portal",
            "body": "IBPS",
            "level": "Central (All India)",
            "url": "https://www.ibps.in",
            "description": "Institute of Banking Personnel Selection for Public Sector Bank PO, Clerks, and RRB Gramin Banks.",
            "category": "Banking & Financial",
            "badge": "Public Banks"
        },
        {
            "name": "India Post GDS Online Portal",
            "body": "India Post",
            "level": "Central (All India)",
            "url": "https://indiapostgdsonline.gov.in",
            "description": "Ministry of Communications direct appointment for 44,000+ Gramin Dak Sevaks based on 10th marks.",
            "category": "Postal & Communications",
            "badge": "Postal Dept"
        },
        {
            "name": "TN Teachers Recruitment Board (TRB)",
            "body": "TN TRB",
            "level": "State (Tamil Nadu)",
            "url": "https://trb.tn.gov.in",
            "description": "Government school teachers, PG assistants, and TNTET Teacher Eligibility Tests in Tamil Nadu.",
            "category": "Education & Teaching",
            "badge": "Tamil Nadu"
        },
        {
            "name": "Karnataka PSC (KPSC) Portal",
            "body": "KPSC",
            "level": "State (Karnataka)",
            "url": "https://kpsc.kar.nic.in",
            "description": "KAS Gazetted Probationers and Karnataka State Administrative Services portal.",
            "category": "State Civil Services",
            "badge": "Karnataka"
        },
        {
            "name": "APPSC Online Portal",
            "body": "APPSC",
            "level": "State (Andhra Pradesh)",
            "url": "https://psc.ap.gov.in",
            "description": "Andhra Pradesh Public Service Commission OTPR and Group 1/2 service applications.",
            "category": "State Civil Services",
            "badge": "Andhra Pradesh"
        },
        {
            "name": "Kerala PSC Thulasi Portal",
            "body": "Kerala PSC",
            "level": "State (Kerala)",
            "url": "https://thulasi.psc.kerala.gov.in",
            "description": "Kerala PSC one-time registration, Secretariat Assistant, and Kerala Police Sub-Inspector portal.",
            "category": "State Services",
            "badge": "Kerala"
        }
    ]


@router.get("/api/exams/{id}", response_model=GovtExamRead)
def get_govt_exam_detail(id: int, db: Session = Depends(get_db)):
    exam = db.query(GovtExam).filter(GovtExam.id == id, GovtExam.active == True).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Govt exam notification not found")
    return exam


@router.get("/api/deadlines/summary", response_model=DeadlineSummaryResponse)
def get_deadlines_summary(
    days: int = Query(30, description="Window of days ahead to look for deadlines"),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated stats for finishing soon schemes and exams:
    total upcoming, critical count (<=3 days), warning count (4-7 days),
    and top critical items for prominent alert banners and ticker.
    """
    today = date.today()
    max_date = today + timedelta(days=days)

    schemes = db.query(Scheme).filter(
        Scheme.active == True,
        Scheme.deadline != None,
        Scheme.deadline >= today,
        Scheme.deadline <= max_date
    ).all()

    exams = db.query(GovtExam).filter(
        GovtExam.active == True,
        GovtExam.deadline >= today,
        GovtExam.deadline <= max_date
    ).all()

    all_items: List[UpcomingDeadlineItem] = []

    for s in schemes:
        days_left = (s.deadline - today).days
        urgency = "critical" if days_left <= 3 else ("warning" if days_left <= 7 else "upcoming")
        all_items.append(
            UpcomingDeadlineItem(
                id=s.id,
                type="scheme",
                title_en=s.name_en,
                title_ta=s.name_ta,
                title_hi=s.name_hi,
                level=s.level,
                state=s.state,
                category=s.category,
                deadline=s.deadline,
                days_left=days_left,
                urgency=urgency,
                official_url=s.official_url,
                highlight_badge=s.benefit_text
            )
        )

    for e in exams:
        days_left = (e.deadline - today).days
        urgency = "critical" if days_left <= 3 else ("warning" if days_left <= 7 else "upcoming")
        all_items.append(
            UpcomingDeadlineItem(
                id=e.id,
                type="exam",
                title_en=f"{e.conducting_body} - {e.title_en}",
                title_ta=f"{e.conducting_body} - {e.title_ta}",
                title_hi=f"{e.conducting_body} - {e.title_hi}" if e.title_hi else None,
                level=e.level,
                state=e.state,
                category=e.category,
                deadline=e.deadline,
                days_left=days_left,
                urgency=urgency,
                official_url=e.official_portal_url,
                highlight_badge=f"{e.total_vacancies} | {e.qualification}"
            )
        )

    all_items.sort(key=lambda item: item.days_left)

    critical_items = [i for i in all_items if i.urgency == "critical"]
    warning_count = len([i for i in all_items if i.urgency == "warning"])

    return DeadlineSummaryResponse(
        total_upcoming=len(all_items),
        critical_count=len(critical_items),
        warning_count=warning_count,
        schemes_count=len(schemes),
        exams_count=len(exams),
        critical_items=critical_items[:5],
        days_window=days
    )


@router.get("/api/deadlines/upcoming", response_model=List[UpcomingDeadlineItem])
def get_upcoming_deadlines(
    days: int = Query(30, description="Window of days ahead to look for deadlines"),
    db: Session = Depends(get_db)
):
    """
    Returns schemes and exams that are going to finish/close within the given days window,
    sorted by nearest deadline with urgency ratings.
    """
    today = date.today()
    max_date = today + timedelta(days=days)
    results: List[UpcomingDeadlineItem] = []

    # 1. Check schemes closing soon
    schemes = db.query(Scheme).filter(
        Scheme.active == True,
        Scheme.deadline != None,
        Scheme.deadline >= today,
        Scheme.deadline <= max_date
    ).all()

    for s in schemes:
        days_left = (s.deadline - today).days
        urgency = "critical" if days_left <= 3 else ("warning" if days_left <= 7 else "upcoming")
        results.append(
            UpcomingDeadlineItem(
                id=s.id,
                type="scheme",
                title_en=s.name_en,
                title_ta=s.name_ta,
                title_hi=s.name_hi,
                level=s.level,
                state=s.state,
                category=s.category,
                deadline=s.deadline,
                days_left=days_left,
                urgency=urgency,
                official_url=s.official_url,
                highlight_badge=s.benefit_text
            )
        )

    # 2. Check exams closing soon
    exams = db.query(GovtExam).filter(
        GovtExam.active == True,
        GovtExam.deadline >= today,
        GovtExam.deadline <= max_date
    ).all()

    for e in exams:
        days_left = (e.deadline - today).days
        urgency = "critical" if days_left <= 3 else ("warning" if days_left <= 7 else "upcoming")
        results.append(
            UpcomingDeadlineItem(
                id=e.id,
                type="exam",
                title_en=f"{e.conducting_body} - {e.title_en}",
                title_ta=f"{e.conducting_body} - {e.title_ta}",
                title_hi=f"{e.conducting_body} - {e.title_hi}" if e.title_hi else None,
                level=e.level,
                state=e.state,
                category=e.category,
                deadline=e.deadline,
                days_left=days_left,
                urgency=urgency,
                official_url=e.official_portal_url,
                highlight_badge=f"{e.total_vacancies} | {e.qualification}"
            )
        )

    # Sort all by days_left ascending
    results.sort(key=lambda item: item.days_left)
    return results


@router.post("/api/reminders", response_model=ReminderRead)
def create_user_reminder(payload: ReminderCreate, db: Session = Depends(get_db)):
    """Save a user reminder preference for a scheme or exam. Deduplicates existing records."""
    existing = db.query(UserReminder).filter(
        UserReminder.device_id == payload.device_id,
        UserReminder.item_type == payload.item_type,
        UserReminder.item_id == payload.item_id
    ).first()

    now_utc = datetime.now(timezone.utc)

    if existing:
        existing.title = payload.title
        existing.deadline = payload.deadline
        existing.contact_email = payload.contact_email or existing.contact_email
        existing.contact_phone = payload.contact_phone or existing.contact_phone
        existing.notes = payload.notes or existing.notes
        existing.created_at = now_utc
        db.commit()
        db.refresh(existing)
        return existing

    reminder = UserReminder(
        device_id=payload.device_id,
        item_type=payload.item_type,
        item_id=payload.item_id,
        title=payload.title,
        deadline=payload.deadline,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        notes=payload.notes,
        created_at=now_utc
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.get("/api/reminders", response_model=List[ReminderRead])
def list_user_reminders(
    device_id: str = Query(..., description="Device ID to retrieve reminders for"),
    db: Session = Depends(get_db)
):
    """Retrieve saved reminders for a device."""
    return db.query(UserReminder).filter(
        UserReminder.device_id == device_id
    ).order_by(UserReminder.deadline.asc()).all()


@router.delete("/api/reminders/{reminder_id}")
def delete_user_reminder(
    reminder_id: int,
    device_id: str = Query(..., description="Device ID verification"),
    db: Session = Depends(get_db)
):
    """Delete a saved reminder."""
    reminder = db.query(UserReminder).filter(
        UserReminder.id == reminder_id,
        UserReminder.device_id == device_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    return {"message": "Reminder removed successfully", "id": reminder_id}

