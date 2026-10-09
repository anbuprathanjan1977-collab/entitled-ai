import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.seed.seed_data import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db)
    db.close()

client = TestClient(app)

def test_get_districts():
    resp = client.get("/api/districts")
    assert resp.status_code == 200
    districts = resp.json()
    assert len(districts) == 38
    names = [d["en"] for d in districts]
    assert "Chennai" in names
    assert "Madurai" in names
    assert "Coimbatore" in names

def test_list_schemes():
    resp = client.get("/api/schemes")
    assert resp.status_code == 200
    schemes = resp.json()
    assert len(schemes) >= 5

def test_match_endpoint_female_ug_student():
    # Female UG student in Tamil Nadu -> Pudhumai Penn should be eligible
    payload = {
        "gender": "female",
        "education": "Under Graduate",
        "state": "Tamil Nadu",
        "age": 20,
        "family_income": 120000
    }
    resp = client.post("/api/match", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "eligible" in data
    assert "almost_eligible" in data
    assert "top_picks" in data
    assert data["total_eligible_count"] > 0
    assert data["total_eligible_benefit"] > 0

    eligible_names = [item["scheme"]["name_en"] for item in data["eligible"]]
    assert any("Pudhumai Penn" in name for name in eligible_names)

def test_match_endpoint_almost_eligible_due_to_income():
    # SC student with income above 2.5L -> almost eligible for Post-Matric
    payload = {
        "community": "SC",
        "education": "Under Graduate",
        "family_income": 280000,
        "state": "Tamil Nadu",
        "gender": "male",
        "age": 20
    }
    resp = client.post("/api/match", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    almost_names = [item["scheme"]["name_en"] for item in data["almost_eligible"]]
    assert any("Post-Matric" in name for name in almost_names)
    
    # Check structured failure reason
    post_matric_match = next(item for item in data["almost_eligible"] if "Post-Matric" in item["scheme"]["name_en"])
    assert len(post_matric_match["failed_reasons"]) == 1
    assert post_matric_match["failed_reasons"][0]["field"] == "family_income"
    assert post_matric_match["failed_reasons"][0]["gap_amount"] == 30000

def test_whatif_endpoint():
    payload = {
        "profile": {
            "community": "SC",
            "education": "Under Graduate",
            "family_income": 300000,
            "state": "Tamil Nadu"
        },
        "changes": {
            "family_income": 200000
        }
    }
    resp = client.post("/api/whatif", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "newly_eligible" in data
    # Post matric should become newly eligible when income drops below 2.5L
    newly_names = [item["scheme"]["name_en"] for item in data["newly_eligible"]]
    assert any("Post-Matric" in name for name in newly_names)

def test_family_match_endpoint():
    payload = {
        "family_income": 180000,
        "state": "Tamil Nadu",
        "members": [
            {
                "name": "Kavitha",
                "relationship": "Daughter",
                "age": 19,
                "gender": "female",
                "education": "Under Graduate"
            },
            {
                "name": "Lakshmi",
                "relationship": "Mother",
                "age": 44,
                "gender": "female",
                "education": "10th pass"
            }
        ]
    }
    resp = client.post("/api/match/family", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "family_summary" in data
    assert data["family_summary"]["member_count"] == 2
    assert data["family_summary"]["total_estimated_annual_benefit"] > 0
    assert len(data["members"]) == 2

def test_states_endpoint():
    resp = client.get("/api/states")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) >= 28
    codes = [s["code"] for s in states]
    assert "TN" in codes
    assert "KA" in codes
    assert "MH" in codes

def test_search_schemes_endpoint():
    resp = client.get("/api/schemes?search=Kisan")
    assert resp.status_code == 200
    schemes = resp.json()
    assert len(schemes) >= 1
    assert any("PM-KISAN" in s["name_en"] for s in schemes)

def test_ai_assistant_chat_endpoint():
    # Test Aadhaar question
    payload = {
        "message": "How to download e-Aadhaar card?",
        "language": "en"
    }
    resp = client.post("/api/assistant/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "myaadhaar.uidai.gov.in" in data["reply"]
    assert len(data["suggested_questions"]) > 0

    # Test Tamil question
    payload_ta = {
        "message": "பான் கார்டு எப்படி பதிவிறக்கம் செய்வது?",
        "language": "ta"
    }
    resp_ta = client.post("/api/assistant/chat", json=payload_ta)
    assert resp_ta.status_code == 200
    assert "incometax.gov.in" in resp_ta.json()["reply"]

    # Test "what are steps" query (The exact user query!)
    payload_steps = {
        "message": "what are steps",
        "language": "en"
    }
    resp_steps = client.post("/api/assistant/chat", json=payload_steps)
    assert resp_steps.status_code == 200
    data_steps = resp_steps.json()
    assert data_steps["category"] == "steps"
    assert "Step 1" in data_steps["reply"]
    assert "Entitle AI" in data_steps["reply"]

    # Test "what are steps" in Tamil
    payload_steps_ta = {
        "message": "விண்ணப்பிக்கும் படிகள் என்ன?",
        "language": "ta"
    }
    resp_steps_ta = client.post("/api/assistant/chat", json=payload_steps_ta)
    assert resp_steps_ta.status_code == 200
    assert "படி 1" in resp_steps_ta.json()["reply"]

def test_list_govt_exams():
    resp = client.get("/api/exams")
    assert resp.status_code == 200
    exams = resp.json()
    assert len(exams) >= 10
    
    # Test level filter
    central_resp = client.get("/api/exams?level=central")
    assert central_resp.status_code == 200
    for e in central_resp.json():
        assert e["level"] == "central"

    # Test search filter
    upsc_resp = client.get("/api/exams?search=UPSC")
    assert upsc_resp.status_code == 200
    assert len(upsc_resp.json()) >= 2

def test_upcoming_deadlines():
    resp = client.get("/api/deadlines/upcoming?days=30")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 5
    # Should include both schemes and exams
    types = [i["type"] for i in items]
    assert "scheme" in types
    assert "exam" in types
    # Days left must be sorted asc
    days_left = [i["days_left"] for i in items]
    assert days_left == sorted(days_left)

def test_create_and_delete_reminder():
    payload = {
        "device_id": "test_device_999",
        "item_type": "exam",
        "item_id": 1,
        "title": "UPSC Civil Services 2026",
        "deadline": "2026-05-15",
        "contact_email": "test@example.com"
    }
    create_resp = client.post("/api/reminders", json=payload)
    assert create_resp.status_code == 200
    created = create_resp.json()
    assert created["id"] > 0
    assert created["device_id"] == "test_device_999"

    # List reminders
    list_resp = client.get("/api/reminders?device_id=test_device_999")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # Delete reminder
    del_resp = client.delete(f"/api/reminders/{created['id']}?device_id=test_device_999")
    assert del_resp.status_code == 200

def test_deadlines_summary():
    resp = client.get("/api/deadlines/summary?days=30")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_upcoming"] >= 5
    assert "critical_count" in data
    assert "warning_count" in data
    assert "schemes_count" in data
    assert "exams_count" in data
    assert len(data["critical_items"]) >= 1

def test_exams_portals_directory():
    resp = client.get("/api/exams/portals")
    assert resp.status_code == 200
    portals = resp.json()
    assert len(portals) >= 8
    names = [p["name"] for p in portals]
    assert any("TNPSC" in n for n in names)
    assert any("UPSC" in n for n in names)
    assert any("SSC" in n for n in names)


