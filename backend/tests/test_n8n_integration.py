import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import httpx

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.profile import Student, AcademicProfile, StudentSkill, StudentInterest
from backend.app.services.n8n_service import (
    format_current_study,
    build_student_registered_payload,
    send_n8n_webhook,
    process_student_registration_webhook,
    reset_dispatched_ids
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_n8n_cache():
    reset_dispatched_ids()
    yield
    reset_dispatched_ids()


def test_format_current_study():
    s_btech = Student(education_stage="b_tech")
    s_btech.academic_profile = AcademicProfile(branch="Artificial Intelligence")
    assert format_current_study(s_btech) == "B.Tech in Artificial Intelligence"

    s_inter = Student(education_stage="intermediate")
    s_inter.academic_profile = AcademicProfile(stream="MPC")
    assert format_current_study(s_inter) == "Intermediate (MPC)"

    s_c10 = Student(education_stage="class_10")
    s_c10.academic_profile = AcademicProfile()
    assert format_current_study(s_c10) == "Class 10"


def test_build_student_registered_payload():
    student = Student(
        id="test-student-n8n-001",
        name="Shiva Nallela",
        email="shiva.test@ascend.dev",
        education_stage="b_tech",
        target_role="AI Engineer"
    )
    student.academic_profile = AcademicProfile(
        branch="Computer Science and Engineering",
        year="1st Year"
    )
    student.skills = [
        StudentSkill(skill_name="Python", proficiency="Advanced"),
        StudentSkill(skill_name="PyTorch", proficiency="Intermediate")
    ]
    student.interests = [
        StudentInterest(interest="AI & Machine Learning")
    ]

    payload = build_student_registered_payload(student, base_url="http://localhost:3000")

    assert payload["event"] == "student_registered"
    assert payload["student_id"] == "test-student-n8n-001"
    assert payload["name"] == "Shiva Nallela"
    assert payload["email"] == "shiva.test@ascend.dev"
    assert payload["current_study"] == "B.Tech 1st Year"
    assert payload["year"] == "1st Year"
    assert "Python" in payload["skills"]
    assert "PyTorch" in payload["skills"]
    assert "AI & Machine Learning" in payload["interests"]
    assert payload["career_goal"] == "AI Engineer"
    assert payload["profile_url"] == "http://localhost:3000/dashboard?student_id=test-student-n8n-001"


def test_send_n8n_webhook_success():
    payload = {
        "event": "student_registered",
        "student_id": "test-123",
        "name": "Test Student"
    }

    mock_resp = MagicMock()
    mock_resp.is_success = True
    mock_resp.status_code = 200

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post:
        success = send_n8n_webhook(payload, webhook_url="https://mock.n8n.cloud/webhook/test")
        assert success is True
        mock_post.assert_called_once()


def test_send_n8n_webhook_header_auth():
    from backend.app.core.config import settings

    payload = {
        "event": "student_registered",
        "student_id": "test-auth-123",
        "name": "Auth Test"
    }

    mock_resp = MagicMock()
    mock_resp.is_success = True
    mock_resp.status_code = 200

    with patch.object(settings, "ASCEND_WEBHOOK_KEY", "secret-test-key-123"), \
         patch.object(settings, "ASCEND_WEBHOOK_HEADER_NAME", "X-Custom-Webhook-Key"), \
         patch("httpx.Client.post", return_value=mock_resp) as mock_post:
        success = send_n8n_webhook(payload, webhook_url="https://mock.n8n.cloud/webhook/test")
        assert success is True
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args[1]
        headers = call_kwargs["headers"]
        assert headers["X-Custom-Webhook-Key"] == "secret-test-key-123"


def test_send_n8n_webhook_failure_resilience():
    payload = {
        "event": "student_registered",
        "student_id": "test-456",
        "name": "Test Student"
    }

    # Case 1: Server 500 error
    mock_resp = MagicMock()
    mock_resp.is_success = False
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error in n8n workflow"

    with patch("httpx.Client.post", return_value=mock_resp):
        success = send_n8n_webhook(payload, webhook_url="https://mock.n8n.cloud/webhook/test")
        assert success is False  # Fails gracefully without raising

    # Case 2: Timeout exception
    with patch("httpx.Client.post", side_effect=httpx.TimeoutException("Connection timed out")):
        success = send_n8n_webhook(payload, webhook_url="https://mock.n8n.cloud/webhook/test")
        assert success is False  # Timeout handled cleanly without crashing


def test_deduplication_prevents_duplicate_dispatches():
    db = SessionLocal()
    try:
        # Create or find a test student
        test_email = "dedup.test@ascend.dev"
        student = db.query(Student).filter(Student.email == test_email).first()
        if not student:
            student = Student(
                name="Dedup Test User",
                email=test_email,
                education_stage="b_tech"
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        mock_resp = MagicMock()
        mock_resp.is_success = True
        mock_resp.status_code = 200

        with patch("httpx.Client.post", return_value=mock_resp) as mock_post:
            # First call should dispatch
            res1 = process_student_registration_webhook(student.id, db=db)
            assert res1 is True
            assert mock_post.call_count == 1

            # Second call should be deduplicated
            res2 = process_student_registration_webhook(student.id, db=db)
            assert res2 is False
            assert mock_post.call_count == 1  # Not called again
    finally:
        db.close()


def test_registration_endpoint_dispatches_webhook_and_resilient_on_error():
    unique_email = f"n8n.reg.test.{id(object())}@ascend.dev"
    reg_payload = {
        "name": "Integration Tester",
        "email": unique_email,
        "password": "securepassword123",
        "education_stage": "b_tech",
        "year": "2nd Year",
        "branch_or_stream": "Computer Science and Engineering",
        "school_or_college": "ASCEND Institute of Tech",
        "score": 8.8,
        "location": "Hyderabad, India"
    }

    # Simulate n8n being temporarily unavailable (returning False or error)
    with patch("backend.app.services.n8n_service.send_n8n_webhook", return_value=False) as mock_hook:
        response = client.post("/api/v1/auth/register", json=reg_payload)
        
        # Registration must succeed despite webhook failure
        assert response.status_code == 201
        assert mock_hook.called
        data = response.json()
        assert data["email"] == unique_email
        assert data["student_id"] is not None
        assert data["has_profile"] is True

        # Verify database record is committed and intact
        db = SessionLocal()
        saved = db.query(Student).filter(Student.email == unique_email).first()
        assert saved is not None
        assert saved.name == "Integration Tester"
        assert saved.academic_profile is not None
        assert saved.academic_profile.branch == "Computer Science and Engineering"
        db.close()
