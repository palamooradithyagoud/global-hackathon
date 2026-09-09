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


def test_stage_isolation_class_10():
    # Login as Class 10 demo student
    auth_res = client.post("/api/v1/auth/demo", json={"education_stage": "class_10"})
    assert auth_res.status_code == 200
    student_id = auth_res.json()["student_id"]
    assert student_id is not None

    pers_res = client.get(f"/api/v1/scholarships/personalized?student_id={student_id}")
    assert pers_res.status_code == 200
    opportunities = pers_res.json()
    assert len(opportunities) > 0

    # Verify EVERY returned scholarship is eligible for class_10
    for opp in opportunities:
        stages = [s.lower() for s in opp["eligible_stages"]]
        assert "class_10" in stages, f"Scholarship '{opp['title']}' with stages {stages} should not appear for class_10 student!"


def test_stage_isolation_intermediate():
    # Login as Intermediate demo student
    auth_res = client.post("/api/v1/auth/demo", json={"education_stage": "intermediate"})
    assert auth_res.status_code == 200
    student_id = auth_res.json()["student_id"]
    assert student_id is not None

    pers_res = client.get(f"/api/v1/scholarships/personalized?student_id={student_id}")
    assert pers_res.status_code == 200
    opportunities = pers_res.json()
    assert len(opportunities) > 0

    # Verify EVERY returned scholarship is eligible for intermediate
    for opp in opportunities:
        stages = [s.lower() for s in opp["eligible_stages"]]
        assert "intermediate" in stages, f"Scholarship '{opp['title']}' with stages {stages} should not appear for intermediate student!"


def test_stage_isolation_b_tech():
    # Login as B.Tech demo student
    auth_res = client.post("/api/v1/auth/demo", json={"education_stage": "b_tech"})
    assert auth_res.status_code == 200
    student_id = auth_res.json()["student_id"]
    assert student_id is not None

    pers_res = client.get(f"/api/v1/scholarships/personalized?student_id={student_id}")
    assert pers_res.status_code == 200
    opportunities = pers_res.json()
    assert len(opportunities) > 0

    # Verify EVERY returned scholarship is eligible for b_tech
    for opp in opportunities:
        stages = [s.lower() for s in opp["eligible_stages"]]
        assert "b_tech" in stages, f"Scholarship '{opp['title']}' with stages {stages} should not appear for b_tech student!"
