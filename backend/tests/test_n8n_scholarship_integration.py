import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import httpx

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.profile import Student, AcademicProfile
from backend.app.services.n8n_service import (
    format_current_study,
    get_student_previous_percentage,
    build_scholarship_eligibility_payload,
    send_n8n_scholarship_webhook,
    process_scholarship_eligibility_webhook,
    reset_dispatched_ids,
    reset_dispatched_scholarship_ids
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_n8n_caches():
    reset_dispatched_ids()
    reset_dispatched_scholarship_ids()
    yield
    reset_dispatched_ids()
    reset_dispatched_scholarship_ids()


def test_format_current_study_scholarship():
    # B.Tech
    s_btech_1 = Student(education_stage="b_tech")
    s_btech_1.academic_profile = AcademicProfile(year="1st Year", branch="CSE")
    assert format_current_study(s_btech_1) == "B.Tech 1st Year"

    s_btech_2 = Student(education_stage="b_tech")
    s_btech_2.academic_profile = AcademicProfile(year="B.Tech 2nd Year")
    assert format_current_study(s_btech_2) == "B.Tech 2nd Year"

    s_btech_nobranch = Student(education_stage="b_tech")
    s_btech_nobranch.academic_profile = AcademicProfile(branch="Artificial Intelligence")
    assert format_current_study(s_btech_nobranch) == "B.Tech in Artificial Intelligence"

    # Intermediate
    s_inter_1 = Student(education_stage="intermediate")
    s_inter_1.academic_profile = AcademicProfile(year="1st Year (11th)")
    assert format_current_study(s_inter_1) == "Intermediate 1st Year"

    s_inter_2 = Student(education_stage="intermediate")
    s_inter_2.academic_profile = AcademicProfile(year="2nd Year (12th)")
    assert format_current_study(s_inter_2) == "Intermediate 2nd Year"

    # Class 10
    s_c10 = Student(education_stage="class_10")
    s_c10.academic_profile = AcademicProfile(year="Class 10")
    assert format_current_study(s_c10) == "Class 10"


def test_get_student_previous_percentage():
    # With explicit percentage
    s1 = Student(education_stage="b_tech")
    s1.academic_profile = AcademicProfile(percentage=88.5)
    assert get_student_previous_percentage(s1) == 88.5

    # With CGPA only (converted via cgpa * 9.5)
    s2 = Student(education_stage="b_tech")
    s2.academic_profile = AcademicProfile(cgpa=8.0)
    assert get_student_previous_percentage(s2) == 76.0

    # With empty academic profile
    s3 = Student(education_stage="class_10")
    s3.academic_profile = None
    assert get_student_previous_percentage(s3) == 0.0


def test_build_scholarship_eligibility_payload():
    student = Student(
        id="test-student-scholarship-001",
        name="Adithya Goud",
        email="adithya.test@skillcatalyst.dev",
        education_stage="b_tech"
    )
    student.academic_profile = AcademicProfile(
        branch="Computer Science and Engineering",
        year="1st Year",
        percentage=86.5
    )

    payload = build_scholarship_eligibility_payload(student)

    assert payload["name"] == "Adithya Goud"
    assert payload["email"] == "adithya.test@skillcatalyst.dev"
    assert payload["current_study"] == "B.Tech 1st Year"
    assert payload["previous_percentage"] == 86.5
    assert payload["Email"] == "adithya.test@skillcatalyst.dev"
    assert payload["student_email"] == "adithya.test@skillcatalyst.dev"
    assert payload["field-1"] == "adithya.test@skillcatalyst.dev"


def test_send_n8n_scholarship_webhook_success():
    payload = {
        "name": "Adithya Goud",
        "email": "adithya.test@skillcatalyst.dev",
        "current_study": "B.Tech 1st Year",
        "previous_percentage": 86.5
    }

    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.is_success = True
    mock_resp.status_code = 200
    mock_resp.text = '{"message":"Workflow was started"}'

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post:
        success = send_n8n_scholarship_webhook(payload, webhook_url="https://mock.n8n.cloud/webhook/scholarship-check-api")
        assert success is True
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == "https://mock.n8n.cloud/webhook/scholarship-check-api"
        assert kwargs["json"] == payload
        # Ensure Authentication is NONE (no authorization header)
        assert "Authorization" not in kwargs["headers"]
        assert "X-Webhook-Key" not in kwargs["headers"]


def test_send_n8n_scholarship_webhook_failure_resilience():
    payload = {
        "name": "Fail Test",
        "email": "fail@skillcatalyst.dev",
        "current_study": "B.Tech 1st Year",
        "previous_percentage": 75.0
    }

    # Simulate 500 error from n8n
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.is_success = False
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error in n8n workflow"

    with patch("httpx.Client.post", return_value=mock_resp):
        success = send_n8n_scholarship_webhook(payload, webhook_url="https://mock.n8n.cloud/webhook/test")
        assert success is False

    # Simulate network timeout
    with patch("httpx.Client.post", side_effect=httpx.TimeoutException("Connection timed out")):
        success = send_n8n_scholarship_webhook(payload, webhook_url="https://mock.n8n.cloud/webhook/test")
        assert success is False


def test_deduplication_prevents_duplicate_scholarship_dispatches():
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        if not student:
            student = Student(
                name="Dedup Test Student",
                email="dedup.test@skillcatalyst.dev",
                education_stage="b_tech"
            )
            student.academic_profile = AcademicProfile(year="1st Year", percentage=80.0)
            db.add(student)
            db.commit()
            db.refresh(student)

        with patch("backend.app.services.n8n_service.send_n8n_scholarship_webhook", return_value=True) as mock_send:
            first_run = process_scholarship_eligibility_webhook(student.id, db=db)
            assert first_run is True
            assert mock_send.call_count == 1

            # Second call for the same student in the same session must be skipped
            second_run = process_scholarship_eligibility_webhook(student.id, db=db)
            assert second_run is False
            assert mock_send.call_count == 1
    finally:
        db.close()


def test_registration_triggers_both_welcome_and_scholarship_webhooks():
    unique_email = f"student.both.hooks.{id(object())}@ascend.dev"
    reg_payload = {
        "name": "Integration Both Hooks Student",
        "email": unique_email,
        "password": "Password@123",
        "education_stage": "b_tech",
        "school_or_college": "IIT Hyderabad",
        "branch_or_stream": "Computer Science and Engineering",
        "year": "1st Year",
        "score": 88.0,
        "location": "Hyderabad"
    }

    with patch("backend.app.services.n8n_service.send_n8n_webhook", return_value=True) as mock_welcome:
        with patch("backend.app.services.n8n_service.send_n8n_scholarship_webhook", return_value=True) as mock_scholarship:
            resp = client.post("/api/v1/auth/register", json=reg_payload)
            assert resp.status_code == 201
            data = resp.json()
            assert data["email"] == unique_email
            assert data["has_profile"] is True

            # Verify welcome webhook was dispatched
            assert mock_welcome.call_count == 1
            welcome_payload = mock_welcome.call_args[0][0]
            assert welcome_payload["email"] == unique_email
            assert welcome_payload["current_study"] == "B.Tech 1st Year"

            # Verify scholarship webhook was dispatched
            assert mock_scholarship.call_count == 1
            scholarship_payload = mock_scholarship.call_args[0][0]
            assert scholarship_payload["name"] == "Integration Both Hooks Student"
            assert scholarship_payload["email"] == unique_email
            assert scholarship_payload["current_study"] == "B.Tech 1st Year"
            assert scholarship_payload["previous_percentage"] == 83.6  # 8.8 CGPA * 9.5
            assert scholarship_payload["Email"] == unique_email
            assert scholarship_payload["field-1"] == unique_email


def test_login_triggers_only_greetings_email():
    """Verifies that login triggers the Greetings Email and avoids premature scholarship triggers."""
    unique_email = f"login.greetings.{id(object())}@ascend.dev"
    login_payload = {
        "email": unique_email,
        "password": "Password@123"
    }

    with patch("backend.app.services.n8n_service.send_n8n_webhook", return_value=True) as mock_welcome:
        with patch("backend.app.services.n8n_service.send_n8n_scholarship_webhook", return_value=True) as mock_scholarship:
            resp = client.post("/api/v1/auth/login", json=login_payload)
            assert resp.status_code == 200
            data = resp.json()
            assert data["email"] == unique_email

            # Greetings email must be dispatched
            assert mock_welcome.call_count == 1
            welcome_payload = mock_welcome.call_args[0][0]
            assert welcome_payload["email"] == unique_email

            # Scholarship recommendation must NOT be dispatched on login (waits for profile save)
            assert mock_scholarship.call_count == 0


def test_profile_save_converts_cgpa_to_percentage_and_triggers_scholarship():
    """Verifies that saving a profile converts CGPA to percentage (cgpa * 9.5) and triggers scholarship email."""
    unique_email = f"profile.cgpa.convert.{id(object())}@ascend.dev"
    profile_payload = {
        "name": "CGPA Test Student",
        "email": unique_email,
        "education_stage": "b_tech",
        "location": "Hyderabad, Telangana",
        "target_role": "Software Engineer",
        "academic_profile": {
            "school_or_college": "HITAM Engineering College",
            "board": "CBSE",
            "university": "JNTU",
            "branch": "Computer Science and Engineering",
            "year": "3rd Year",
            "cgpa": 8.5,
            "percentage": None,
            "stream": "MPC"
        },
        "skills": [{"skill_name": "Python", "proficiency": "Advanced"}],
        "projects": [],
        "certifications": [],
        "experience": [],
        "interests": ["AI"],
        "preferences": {"preferred_location": "Hyderabad", "available_learning_time": "3 hours"},
        "financial_context": {"education_budget": "100000", "certification_budget": "10000"}
    }

    with patch("backend.app.services.n8n_service.send_n8n_scholarship_webhook", return_value=True) as mock_scholarship:
        resp = client.post("/api/v1/profile", json=profile_payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["academic_profile"]["cgpa"] == 8.5
        # Must be converted to 8.5 * 9.5 = 80.75%
        assert data["academic_profile"]["percentage"] == 80.75

        # Scholarship recommendation webhook must be dispatched with converted percentage
        assert mock_scholarship.call_count == 1
        scholarship_payload = mock_scholarship.call_args[0][0]
        assert scholarship_payload["email"] == unique_email
        assert scholarship_payload["previous_percentage"] == 80.75
        assert scholarship_payload["previous_percentage"] >= 75.0

