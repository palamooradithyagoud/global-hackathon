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
    """Format human-readable current study field matching student records and n8n email templates."""
    acad = student.academic_profile
    stage = (student.education_stage or "b_tech").lower()
    year = (acad.year if acad and acad.year else "").strip()

    if stage == "b_tech":
        if year:
            return f"B.Tech {year}"
        if acad and acad.branch:
            return f"B.Tech in {acad.branch}"
        return "B.Tech 1st Year"
    elif stage == "intermediate":
        if year:
            return f"Intermediate {year}"
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
    Provides aliases for full compatibility with existing n8n email workflows.
    """
    web_base = (base_url or settings.ASCEND_WEB_URL or settings.FRONTEND_BASE_URL or "http://localhost:3000").rstrip("/")
    acad = student.academic_profile
    cur_study = format_current_study(student)

    # Extract clean list of skills
    skills_list: List[str] = [s.skill_name for s in student.skills] if student.skills else []

    # Extract clean list of interests
    interests_list: List[str] = [i.interest for i in student.interests] if student.interests else []

    # Determine year
    year_val = acad.year if acad and acad.year else "1st Year"

    # Determine career goal
    career_goal = student.target_role or (acad.future_direction if acad else None) or "Technology Professional"

    # Actual valid existing ASCEND dashboard route inspected from frontend/src/app/dashboard/page.tsx
    dash_url = f"{web_base}/dashboard?student_id={student.id}"

    payload = {
        "event": "student_registered",
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "current_study": cur_study,
        "year": year_val,
        "skills": skills_list,
        "interests": interests_list,
        "career_goal": career_goal,
        "profile_url": dash_url,
        "dashboard_url": dash_url,
        "explore_url": dash_url,
        # Field aliases for backwards compatibility with any existing n8n form-derived workflows
        "field-0": student.name,
        "field-1": student.email,
        "field-2": cur_study,
    }

    return payload


def send_n8n_webhook(payload: Dict[str, Any], webhook_url: Optional[str] = None) -> bool:
    """
    Sends the payload to the n8n production webhook via HTTP POST.
    Includes Header Auth if ASCEND_WEBHOOK_KEY is configured.
    If production webhook is inactive and returns 404, automatically attempts the test webhook.
    Never throws uncaught exceptions, ensuring database registration always succeeds.
    """
    target_url = webhook_url or settings.ASCEND_WEBHOOK_URL or settings.N8N_WEBHOOK_URL
    if not settings.N8N_WEBHOOK_ENABLED or not target_url:
        logger.info("[n8n] Webhook is disabled or URL not configured. Skipping dispatch.")
        return False

    headers = {"Content-Type": "application/json"}

    # Include Header Auth if configured
    if settings.ASCEND_WEBHOOK_KEY:
        header_name = settings.ASCEND_WEBHOOK_HEADER_NAME or "X-Webhook-Key"
        headers[header_name] = settings.ASCEND_WEBHOOK_KEY
        # Also provide standard authorization aliases if custom header is used
        if header_name.lower() != "authorization":
            headers["Authorization"] = settings.ASCEND_WEBHOOK_KEY
        if header_name.lower() != "x-api-key":
            headers["X-API-KEY"] = settings.ASCEND_WEBHOOK_KEY

    try:
        logger.info(f"[n8n] Dispatching '{payload.get('event')}' webhook for student {payload.get('student_id')} to {target_url}")
        with httpx.Client(timeout=10.0) as client:
            response = client.post(target_url, json=payload, headers=headers)
            
            if response.is_success:
                logger.info(f"[n8n] Webhook successfully delivered: HTTP {response.status_code}")
                return True

            # If production webhook returns 404 (workflow not active), check test webhook if in editor
            if response.status_code == 404 and "/webhook/" in target_url:
                test_url = target_url.replace("/webhook/", "/webhook-test/")
                logger.info(f"[n8n] Production webhook returned 404 (workflow inactive). Attempting test webhook: {test_url}")
                try:
                    test_response = client.post(test_url, json=payload, headers=headers)
                    if test_response.is_success:
                        logger.info(f"[n8n] Test webhook successfully delivered: HTTP {test_response.status_code}")
                        return True
                    else:
                        logger.warning(
                            f"[n8n] Both production and test webhooks returned 404.\n"
                            f"ACTION REQUIRED IN N8N: Please activate the workflow toggle in the top-right of your n8n canvas "
                            f"(or click 'Execute workflow' / 'Listen for test event' in the editor) to receive executions."
                        )
                        return False
                except Exception as test_exc:
                    logger.warning(f"[n8n] Test webhook attempt failed: {test_exc}")
                    return False

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
        
        # Only mark as dispatched if webhook was successfully accepted by n8n
        if success:
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
