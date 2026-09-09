import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_resume_text_extraction():
    sample_resume_content = """
    Kavya Sundaram
    kavya.sundaram@vitstudent.ac.in | +91 9876543210 | Chennai, India
    
    EDUCATION
    Vellore Institute of Technology (VIT)
    Bachelor of Technology in Computer Science and Engineering
    Graduation: 2026 | CGPA: 8.75 / 10.0
    
    TECHNICAL SKILLS
    Languages: Python, TypeScript, Java, SQL, C++
    Frameworks & Tools: React, Next.js, FastAPI, Docker, Git, PostgreSQL
    
    PROJECTS
    Intelligent Resume Parser
    Engineered an automated parsing engine extracting structured JSON entities from multi-page resumes.
    Technologies: Python, FastAPI, Docker
    Link: https://github.com/kavyas/resume-parser
    
    CERTIFICATIONS
    AWS Certified Solutions Architect Associate
    """
    
    file_payload = {"file": ("resume.txt", io.BytesIO(sample_resume_content.encode("utf-8")), "text/plain")}
    response = client.post("/api/v1/profile/resume/extract", files=file_payload)
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "Kavya Sundaram"
    assert data["email"] == "kavya.sundaram@vitstudent.ac.in"
    assert data["education_stage"] == "b_tech"
    assert data["cgpa"] == 8.75
    assert len(data["skills"]) >= 4
    # Check that Python and React were detected
    skill_names = [s["skill_name"] for s in data["skills"]]
    assert "Python" in skill_names
    assert "React" in skill_names
