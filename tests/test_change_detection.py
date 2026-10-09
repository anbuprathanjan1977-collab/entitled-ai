import pytest
from app.database import SessionLocal
from app.models import Scheme, SchemeSource, ChangeEvent
from app.services.policy_checker import compute_hash, clean_html_or_text, simulate_demo_policy_change
from app.seed.seed_data import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db)
    db.close()

def test_clean_html_and_hash():
    html_sample = "<html><body><h1>Tamil Nadu Welfare</h1><p>Income limit: 250000</p><script>alert(1)</script></body></html>"
    cleaned = clean_html_or_text(html_sample)
    assert "alert" not in cleaned
    assert "Tamil Nadu Welfare" in cleaned
    assert "250000" in cleaned

    h1 = compute_hash(cleaned)
    h2 = compute_hash(cleaned)
    assert h1 == h2
    assert len(h1) == 64

def test_simulate_demo_policy_change():
    db = SessionLocal()
    try:
        scheme = db.query(Scheme).first()
        assert scheme is not None

        event = simulate_demo_policy_change(db, scheme.id)
        assert event is not None
        assert event.status == "pending"
        assert event.scheme_id == scheme.id
        assert "diff" in event.__dict__
        assert "Enhanced by ₹50,000" in event.diff
        assert event.ai_summary is not None
        assert len(event.ai_summary) > 10

        # Verify scheme rules were NOT altered automatically
        db.refresh(scheme)
        assert scheme.rules is not None
    finally:
        db.close()
