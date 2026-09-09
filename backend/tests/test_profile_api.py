import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_btech_profile():
    payload = {
        "name": "Priya Varma",
        "email": "priya.varma@example.edu",
        "date_of_birth": "2004-05-12",
        "location": "Bengaluru, Karnataka",
        "education_stage": "b_tech",
        "target_role": "Data Scientist",
        "academic_profile": {
            "school_or_college": "RV College of Engineering",
            "university": "VTU",
            "branch": "Computer Science and Engineering",
            "year": "3rd Year",
            "cgpa": 8.85
        },
        "skills": [
            {"skill_name": "Python", "proficiency": "Advanced"},
            {"skill_name": "Machine Learning", "proficiency": "Intermediate"},
            {"skill_name": "SQL", "proficiency": "Intermediate"}
        ],
        "projects": [
            {
                "name": "Predictive Health Analytics",
                "description": "ML pipeline for early detection of clinical indicators.",
                "technologies": "Python, Scikit-Learn, FastAPI",
                "github_url": "https://github.com/priyavarma/health-analytics"
            }
        ],
        "certifications": [
            {
                "name": "TensorFlow Developer Certificate",
                "issuer": "Google",
                "date": "2024"
            }
        ],
        "experience": [],
        "interests": ["Artificial Intelligence", "Healthcare"],
        "preferences": {
            "preferred_location": "Bengaluru",
            "available_learning_time": "2–4 hours/day"
        },
        "financial_context": {
            "education_budget": "₹2,00,000 / year",
            "certification_budget": "₹20,000"
        }
    }

    response = client.post("/api/v1/profile", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Priya Varma"
    assert data["education_stage"] == "b_tech"
    assert data["academic_profile"]["cgpa"] == 8.85
    assert len(data["skills"]) == 3
    assert data["intelligence_summary"] is not None
    assert data["intelligence_summary"]["completeness_percentage"] >= 80

    # Retrieve profile
    student_id = data["id"]
    get_res = client.get(f"/api/v1/profile/{student_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == student_id


def test_btech_validation_fails_without_branch_or_cgpa():
    # Missing required branch and cgpa for B.Tech
    payload = {
        "name": "Invalid Student",
        "email": "invalid@example.com",
        "education_stage": "b_tech",
        "academic_profile": {
            "school_or_college": "Some College"
            # branch and cgpa missing!
        }
    }
    response = client.post("/api/v1/profile", json=payload)
    assert response.status_code == 422


def test_create_class_10_profile():
    payload = {
        "name": "Rohan Gupta",
        "email": "rohan.gupta@example.edu",
        "education_stage": "class_10",
        "academic_profile": {
            "school_or_college": "Delhi Public School",
            "board": "CBSE",
            "percentage": 91.5,
            "future_direction": "Intermediate"
        },
        "interests": ["Science", "Technology", "Design"],
        "skills": [],
        "projects": []
    }
    response = client.post("/api/v1/profile", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["education_stage"] == "class_10"
    assert data["academic_profile"]["percentage"] == 91.5
    assert data["intelligence_summary"]["completeness_percentage"] >= 70


def test_create_intermediate_profile():
    payload = {
        "name": "Sneha Reddy",
        "email": "sneha.reddy@example.edu",
        "education_stage": "intermediate",
        "academic_profile": {
            "school_or_college": "Narayana Junior College",
            "board": "Telangana State Board",
            "stream": "MPC",
            "year": "2nd Year",
            "percentage": 94.2,
            "future_direction": "Engineering"
        },
        "interests": ["Mathematics", "Physics"],
        "skills": [],
        "projects": []
    }
    response = client.post("/api/v1/profile", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["education_stage"] == "intermediate"
    assert data["academic_profile"]["stream"] == "MPC"
