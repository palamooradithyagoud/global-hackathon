import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_scholarship_preview():
    response = client.get("/api/v1/scholarships/preview")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    # Check that preview status is 'Eligibility not checked yet'
    for item in data:
        assert item["eligibility_status"] == "Eligibility not checked yet"
        assert item["title"] is not None
        assert item["benefit_value"] is not None


def test_personalized_scholarships_demo_student():
    # First get demo student auth
    auth_res = client.post("/api/v1/auth/demo")
    assert auth_res.status_code == 200
    student_id = auth_res.json().get("student_id")
    
    assert student_id is not None
    
    # Get personalized scholarships
    pers_res = client.get(f"/api/v1/scholarships/personalized?student_id={student_id}")
    assert pers_res.status_code == 200
    opportunities = pers_res.json()
    assert len(opportunities) > 0
    
    first = opportunities[0]
    assert "match_score" in first
    assert "is_eligible" in first
    assert len(first["match_reasons"]) > 0
