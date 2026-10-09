import asyncio
import difflib
import hashlib
import logging
from datetime import datetime, date
from typing import List, Optional
import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models import Scheme, SchemeSource, ChangeEvent
from app.services.llm_service import generate_policy_diff_summary

logger = logging.getLogger(__name__)

USER_AGENT = "UrimaiAI-PolicyMonitor/1.0 (+https://urimai.ai; Public Scheme Eligibility Tracker)"

def compute_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def clean_html_or_text(content: str) -> str:
    try:
        soup = BeautifulSoup(content, "html.parser")
        # Remove script and style elements
        for s in soup(["script", "style", "nav", "footer", "header"]):
            s.extract()
        text = soup.get_text(separator=" ", strip=True)
        return " ".join(text.split())
    except Exception:
        return " ".join(content.split())

async def fetch_source_content(url: str) -> str:
    """Politely fetches source content with retries and timeout."""
    headers = {"User-Agent": USER_AGENT}
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return resp.text
        except Exception as e:
            if attempt == 1:
                raise e
            await asyncio.sleep(1.0)
    raise RuntimeError(f"Failed to fetch content from {url}")

async def check_source_for_updates(db: Session, source: SchemeSource) -> Optional[ChangeEvent]:
    """
    Checks an individual scheme source for text/policy updates.
    Returns ChangeEvent if a change is detected.
    """
    try:
        raw_content = await fetch_source_content(source.url)
        cleaned_text = clean_html_or_text(raw_content)
        new_hash = compute_hash(cleaned_text)

        source.last_checked = datetime.utcnow()

        if source.last_hash != new_hash and source.last_text:
            # Diff detected
            old_lines = source.last_text.splitlines()
            new_lines = cleaned_text.splitlines()
            diff_lines = list(difflib.unified_diff(
                old_lines, new_lines,
                fromfile="Stored Policy Guidelines",
                tofile="Live Portal Update",
                lineterm=""
            ))
            diff_str = "\n".join(diff_lines) if diff_lines else "Content text updated."

            ai_summary = await generate_policy_diff_summary(source.last_text, cleaned_text, diff_str)

            change_event = ChangeEvent(
                scheme_id=source.scheme_id,
                old_text=source.last_text,
                new_text=cleaned_text,
                diff=diff_str,
                ai_summary=ai_summary,
                status="pending",
                detected_at=datetime.utcnow()
            )
            db.add(change_event)

            # Update source tracker (rules remain untouched until admin approval)
            source.last_hash = new_hash
            source.last_text = cleaned_text
            db.commit()
            db.refresh(change_event)
            return change_event
        else:
            # No changes or first initial run
            if not source.last_text:
                source.last_text = cleaned_text
                source.last_hash = new_hash
            db.commit()
            return None
    except Exception as err:
        logger.error(f"Error checking scheme source {source.id} ({source.url}): {err}")
        # Log failure as a visible event in admin dashboard
        failed_event = ChangeEvent(
            scheme_id=source.scheme_id,
            old_text=source.last_text or "",
            new_text="FETCH ERROR",
            diff=f"Fetch failed for {source.url}: {str(err)}",
            ai_summary=f"Automated crawler encountered network/HTTP error: {str(err)}. Site may be down or blocking bot requests.",
            status="fetch_failed",
            detected_at=datetime.utcnow()
        )
        db.add(failed_event)
        db.commit()
        return failed_event

async def check_all_sources(db: Session) -> List[ChangeEvent]:
    """Scans all registered scheme sources with polite inter-request delay."""
    sources = db.query(SchemeSource).all()
    detected_changes = []
    for src in sources:
        change = await check_source_for_updates(db, src)
        if change:
            detected_changes.append(change)
        await asyncio.sleep(0.5)  # Polite delay
    return detected_changes

def simulate_demo_policy_change(db: Session, scheme_id: Optional[int] = None) -> ChangeEvent:
    """
    Simulates a live policy change event on a scheme for Hackathon judges & demo.
    Demonstrates side-by-side diff, AI summary, and admin approval pipeline.
    """
    if scheme_id:
        scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    else:
        scheme = db.query(Scheme).first()

    if not scheme:
        raise ValueError("No scheme available to simulate policy change.")

    old_text = f"""[GOVERNMENT GAZETTE - TN WELFARE BOARD]
Scheme: {scheme.name_en}
Eligibility Criteria:
1. Annual Family Income Ceiling: ₹2,50,000 per annum.
2. Mandatory Documents: Income Certificate, Aadhaar Card, Community Certificate.
3. Application Deadline: {scheme.deadline.strftime('%Y-%m-%d') if scheme.deadline else 'Continuous'}.
4. Mode of Disbursement: Single window bank clearance."""

    new_text = f"""[GOVERNMENT GAZETTE - TN WELFARE BOARD (AMENDMENT 2026)]
Scheme: {scheme.name_en}
Eligibility Criteria:
1. Annual Family Income Ceiling: ₹3,00,000 per annum (Enhanced by ₹50,000).
2. Mandatory Documents: Income Certificate, Aadhaar Card, Community Certificate, and College Bonafide Certificate.
3. Application Deadline: {(date.today() + datetime.resolution).strftime('%Y-%m-%d') if scheme.deadline else 'Extended by 30 days'}.
4. Mode of Disbursement: Direct Benefit Transfer (DBT) via Aadhaar NPCI Seeding with SMS Alert."""

    old_lines = old_text.splitlines()
    new_lines = new_text.splitlines()
    diff_lines = list(difflib.unified_diff(
        old_lines, new_lines,
        fromfile="Current Stored Guidelines (v1.0)",
        tofile="Official Gazette Amendment (v1.1)",
        lineterm=""
    ))
    diff_str = "\n".join(diff_lines)

    ai_summary = "Policy amendment detected: 1. Annual family income ceiling increased from ₹2,50,000 to ₹3,00,000 (+₹50,000 relief). 2. College Bonafide Certificate added as mandatory document. 3. Direct Benefit Transfer (DBT) via NPCI Aadhaar seeding formalized."

    change_event = ChangeEvent(
        scheme_id=scheme.id,
        old_text=old_text,
        new_text=new_text,
        diff=diff_str,
        ai_summary=ai_summary,
        status="pending",
        detected_at=datetime.utcnow()
    )
    db.add(change_event)
    db.commit()
    db.refresh(change_event)
    return change_event
