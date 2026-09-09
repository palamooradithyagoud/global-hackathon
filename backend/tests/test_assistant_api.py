import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.profile import Student
from backend.app.models.assistant import AssistantMessage, AssistantMemory
from backend.app.core.database import SessionLocal


def test_assistant_chat_without_student_id():
    client = TestClient(app)
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "What scholarships can I apply for in B.Tech?",
            "stage": "b_tech"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)


def test_user_isolation_and_personal_memory():
    """
    Tests:
    1. Strict privacy & isolation: user A and user B have completely separate chat histories.
    2. Personal memory extraction & persistence (study goals, preferred language, weak/strong subjects).
    3. Memory retrieval, update, and clear endpoints.
    """
    db = SessionLocal()
    # Create two test students
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    student_a = Student(
        id=user_a_id,
        name="Student Alpha",
        email=f"alpha_{user_a_id[:8]}@example.com",
        education_stage="b_tech"
    )
    student_b = Student(
        id=user_b_id,
        name="Student Beta",
        email=f"beta_{user_b_id[:8]}@example.com",
        education_stage="b_tech"
    )
    db.add(student_a)
    db.add(student_b)
    db.commit()
    db.close()

    client = TestClient(app)

    try:
        # User A: Shares that preferred language is Python and goal is to crack GATE
        res_a1 = client.post(
            "/api/v1/assistant/chat",
            json={
                "student_id": user_a_id,
                "message": "I prefer Python and my goal is to crack GATE"
            }
        )
        assert res_a1.status_code == 200
        data_a1 = res_a1.json()
        assert "reply" in data_a1

        # User B: Shares that preferred language is Java and weak in Operating Systems
        res_b1 = client.post(
            "/api/v1/assistant/chat",
            json={
                "student_id": user_b_id,
                "message": "I prefer Java and I am weak in Operating Systems"
            }
        )
        assert res_b1.status_code == 200

        # Verify Personal Memory Isolation
        mem_a = client.get(f"/api/v1/assistant/memory/{user_a_id}").json()["memory"]
        mem_b = client.get(f"/api/v1/assistant/memory/{user_b_id}").json()["memory"]

        assert mem_a["preferred_language"] == "Python"
        assert "GATE" in (mem_a["study_goals"] or "")

        assert mem_b["preferred_language"] == "Java"
        assert "Operating Systems" in (mem_b["weak_subjects"] or "")

        # Verify no cross-contamination between users
        assert mem_a["preferred_language"] != mem_b["preferred_language"]

        # Verify Chat History Isolation
        hist_a = client.get(f"/api/v1/assistant/history/{user_a_id}").json()["messages"]
        hist_b = client.get(f"/api/v1/assistant/history/{user_b_id}").json()["messages"]

        assert len(hist_a) == 2  # 1 user + 1 assistant
        assert len(hist_b) == 2
        assert any("Python" in m["content"] for m in hist_a)
        assert not any("Java" in m["content"] for m in hist_a)
        assert any("Java" in m["content"] for m in hist_b)
        assert not any("GATE" in m["content"] for m in hist_b)

        # Test PUT /memory endpoint for direct memory updates
        put_res = client.put(
            f"/api/v1/assistant/memory/{user_a_id}",
            json={
                "career_interests": "Cloud Architect",
                "study_schedule": "3 hours daily"
            }
        )
        assert put_res.status_code == 200
        updated_mem_a = put_res.json()["memory"]
        assert updated_mem_a["career_interests"] == "Cloud Architect"
        assert updated_mem_a["study_schedule"] == "3 hours daily"

        # Test DELETE /memory endpoint
        del_mem = client.delete(f"/api/v1/assistant/memory/{user_a_id}")
        assert del_mem.status_code == 200
        cleared_mem = client.get(f"/api/v1/assistant/memory/{user_a_id}").json()["memory"]
        assert cleared_mem["study_goals"] is None

        # Test DELETE /history endpoint
        del_hist = client.delete(f"/api/v1/assistant/history/{user_a_id}")
        assert del_hist.status_code == 200
        empty_hist = client.get(f"/api/v1/assistant/history/{user_a_id}").json()["messages"]
        assert len(empty_hist) == 0

        # Ensure user B's history is still intact!
        hist_b_still_present = client.get(f"/api/v1/assistant/history/{user_b_id}").json()["messages"]
        assert len(hist_b_still_present) == 2

    finally:
        # Cleanup test students
        cleanup_db = SessionLocal()
        cleanup_db.query(AssistantMessage).filter(AssistantMessage.student_id.in_([user_a_id, user_b_id])).delete(synchronize_session=False)
        cleanup_db.query(AssistantMemory).filter(AssistantMemory.student_id.in_([user_a_id, user_b_id])).delete(synchronize_session=False)
        cleanup_db.query(Student).filter(Student.id.in_([user_a_id, user_b_id])).delete(synchronize_session=False)
        cleanup_db.commit()
        cleanup_db.close()
