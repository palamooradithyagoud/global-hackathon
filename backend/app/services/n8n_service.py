import logging
from typing import Optional, Dict, Any, List, Set
from sqlalchemy.orm import Session, joinedload
import httpx

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.profile import Student

logger = logging.getLogger(__name__)

# In-memory deduplication set to avoid duplicate dispatches for the same student
_dispatched_student_ids: Set[str] = set()


def reset_dispatched_ids() -> None:
    """Utility for test suites to clear dispatched cache."""
    _dispatched_student_ids.clear()


def format_current_study(student: Student) -> str:
    """Format human-readable current study field from student and academic profile."""
    acad = student.academic_profile
    stage = (student.education_stage or "b_tech").lower()

    if stage == "b_tech":
        if acad and acad.branch:
            return f"B.Tech in {acad.branch}"
        return "B.Tech"
    elif stage == "intermediate":
        if acad and acad.stream:
            return f"Intermediate ({acad.stream})"
        return "Intermediate"
    elif stage == "class_10":
        return "Class 10"
    
    return stage.replace("_", " ").title()


def build_student_registered_payload(student: Student, base_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Constructs the exact JSON payload expected by n8n production webhook.
    Uses real database field names and available student records.
    """
    web_base = (base_url or settings.FRONTEND_BASE_URL or "http://localhost:3000").rstrip("/")
    acad = student.academic_profile

    # Extract clean list of skills
    skills_list: List[str] = [s.skill_name for s in student.skills] if student.skills else []

    # Extract clean list of interests
    interests_list: List[str] = [i.interest for i in student.interests] if student.interests else []

    # Determine year
    year_val = acad.year if acad and acad.year else None

    # Determine career goal
    career_goal = student.target_role or (acad.future_direction if acad else None) or "Technology Professional"

    payload = {
        "event": "student_registered",
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "current_study": format_current_study(student),
        "year": year_val,
        "skills": skills_list,
        "interests": interests_list,
        "career_goal": career_goal,
        "profile_url": f"{web_base}/dashboard?student_id={student.id}"
    }

    return payload


def send_n8n_webhook(payload: Dict[str, Any], webhook_url: Optional[str] = None) -> bool:
    """
    Sends the payload to the n8n production webhook via HTTP POST.
    Never throws uncaught exceptions, ensuring database registration always succeeds.
    """
    target_url = webhook_url or settings.N8N_WEBHOOK_URL
    if not settings.N8N_WEBHOOK_ENABLED or not target_url:
        logger.info("[n8n] Webhook is disabled or URL not configured. Skipping dispatch.")
        return False

    try:
        logger.info(f"[n8n] Dispatching '{payload.get('event')}' webhook for student {payload.get('student_id')} to {target_url}")
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                target_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
        if response.is_success:
            logger.info(f"[n8n] Webhook successfully delivered: HTTP {response.status_code}")
            return True
        else:
            logger.warning(
                f"[n8n] Webhook returned non-success HTTP {response.status_code}: {response.text[:200]}"
            )
            return False

    except httpx.TimeoutException:
        logger.warning(f"[n8n] Webhook request to {target_url} timed out after 10 seconds.")
        return False
    except Exception as exc:
        logger.error(f"[n8n] Unexpected error sending webhook to {target_url}: {exc}", exc_info=True)
        return False


def process_student_registration_webhook(student_id: str, db: Optional[Session] = None) -> bool:
    """
    Fetches the student from DB, builds the payload, and posts to n8n if not already dispatched.
    """
    if student_id in _dispatched_student_ids:
        logger.info(f"[n8n] Student {student_id} was already notified via webhook. Skipping duplicate.")
        return False

    close_db_on_finish = False
    if db is None:
        db = SessionLocal()
        close_db_on_finish = True

    try:
        student = (
            db.query(Student)
            .options(
                joinedload(Student.academic_profile),
                joinedload(Student.skills),
                joinedload(Student.interests)
            )
            .filter(Student.id == student_id)
            .first()
        )

        if not student:
            logger.warning(f"[n8n] Student with id {student_id} not found in database. Webhook aborted.")
            return False

        payload = build_student_registered_payload(student)
        success = send_n8n_webhook(payload)
        
        # Mark as dispatched even if webhook had remote issue, to avoid spamming on retries
        _dispatched_student_ids.add(student_id)
        return success

    finally:
        if close_db_on_finish:
            db.close()


def trigger_student_registration_webhook(
    student_id: str,
    db: Optional[Session] = None,
    background_tasks: Optional[Any] = None
) -> None:
    """
    Convenience entrypoint. Uses background_tasks when provided for non-blocking performance.
    """
    if background_tasks is not None and hasattr(background_tasks, "add_task"):
        background_tasks.add_task(process_student_registration_webhook, student_id)
    else:
        process_student_registration_webhook(student_id, db)
