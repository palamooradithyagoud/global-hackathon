import logging
from typing import Optional, Dict, Any, List, Set
from sqlalchemy.orm import Session, joinedload
import httpx

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.profile import Student

logger = logging.getLogger(__name__)

import time

# In-memory deduplication set & timestamp tracking to avoid duplicate dispatches on immediate retries
_dispatched_student_ids: Set[str] = set()
_dispatched_scholarship_student_ids: Set[str] = set()
_dispatched_student_timestamps: Dict[str, float] = {}
_dispatched_scholarship_timestamps: Dict[str, float] = {}
DEDUP_COOLDOWN_SECONDS = 20.0


def reset_dispatched_ids() -> None:
    """Utility for test suites to clear dispatched cache."""
    _dispatched_student_ids.clear()
    _dispatched_student_timestamps.clear()


def reset_dispatched_scholarship_ids() -> None:
    """Utility for test suites to clear scholarship dispatched cache."""
    _dispatched_scholarship_student_ids.clear()
    _dispatched_scholarship_timestamps.clear()


def format_current_study(student: Student) -> str:
    """Format human-readable current study field matching student records and n8n email templates."""
    acad = student.academic_profile
    stage = (student.education_stage or "b_tech").lower()
    year = (acad.year if acad and acad.year else "").strip()

    if stage == "b_tech":
        if year:
            if "1st" in year or year == "1":
                return "B.Tech 1st Year"
            elif "2nd" in year or year == "2":
                return "B.Tech 2nd Year"
            elif "3rd" in year or year == "3":
                return "B.Tech 3rd Year"
            elif "4th" in year or year == "4":
                return "B.Tech 4th Year"
            if year.lower().startswith("b.tech"):
                return year
            return f"B.Tech {year}"
        if acad and acad.branch:
            return f"B.Tech in {acad.branch}"
        return "B.Tech 1st Year"
    elif stage == "intermediate":
        if year:
            if "1st" in year or "11" in year:
                return "Intermediate 1st Year"
            elif "2nd" in year or "12" in year:
                return "Intermediate 2nd Year"
            if year.lower().startswith("intermediate"):
                return year
            return f"Intermediate {year}"
        if acad and acad.stream:
            return f"Intermediate ({acad.stream})"
        return "Intermediate"
    elif stage == "class_10":
        return "Class 10"
    
    return stage.replace("_", " ").title()


def get_student_previous_percentage(student: Student) -> float:
    """
    Extracts the actual previous academic percentage from the student's academic profile.
    Falls back to converting CGPA (cgpa * 9.5) if percentage is unset.
    """
    acad = student.academic_profile
    if acad:
        if acad.percentage is not None and acad.percentage > 0:
            return round(float(acad.percentage), 2)
        if acad.cgpa is not None and acad.cgpa > 0:
            return round(float(acad.cgpa) * 9.5, 2)
    return 0.0


def build_scholarship_eligibility_payload(student: Student) -> Dict[str, Any]:
    """
    Constructs the exact JSON payload expected by the n8n Scholarship Eligibility workflow.
    Uses real database field values from the student and academic profile records:
    {
      "name": student.name,
      "email": student.email,
      "current_study": format_current_study(student),
      "previous_percentage": get_student_previous_percentage(student)
    }
    """
    cur_study = format_current_study(student)
    prev_pct = get_student_previous_percentage(student)

    return {
        "name": student.name,
        "email": student.email,
        "current_study": cur_study,
        "previous_percentage": prev_pct,
        # Field aliases for maximum n8n workflow compatibility
        "Email": student.email,
        "student_email": student.email,
        "to_email": student.email,
        "recipient": student.email,
        "field-0": student.name,
        "field-1": student.email,
        "field-2": cur_study,
        "field-3": prev_pct,
    }


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
        "Email": student.email,
        "student_email": student.email,
        "to_email": student.email,
        "recipient": student.email,
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
        msg = f"[n8n] Dispatching '{payload.get('event')}' webhook for {payload.get('name')} ({payload.get('email')}) to {target_url}"
        print(msg, flush=True)
        logger.info(msg)
        with httpx.Client(timeout=10.0) as client:
            response = client.post(target_url, json=payload, headers=headers)
            
            if response.is_success:
                succ_msg = f"[n8n] Webhook successfully delivered: HTTP {response.status_code} - {response.text.strip()}"
                print(succ_msg, flush=True)
                logger.info(succ_msg)
                return True

            # If production webhook returns 404 (workflow not active), check test webhook if in editor
            if response.status_code == 404 and "/webhook/" in target_url:
                test_url = target_url.replace("/webhook/", "/webhook-test/")
                print(f"[n8n] Production webhook returned 404. Attempting test webhook: {test_url}", flush=True)
                logger.info(f"[n8n] Production webhook returned 404 (workflow inactive). Attempting test webhook: {test_url}")
                try:
                    test_response = client.post(test_url, json=payload, headers=headers)
                    if test_response.is_success:
                        succ_msg = f"[n8n] Test webhook successfully delivered: HTTP {test_response.status_code} - {test_response.text.strip()}"
                        print(succ_msg, flush=True)
                        logger.info(succ_msg)
                        return True
                    else:
                        warn_msg = (
                            f"[n8n] Both production and test webhooks returned 404.\n"
                            f"ACTION REQUIRED IN N8N: Please activate the workflow toggle in the top-right of your n8n canvas "
                            f"(or click 'Execute workflow' / 'Listen for test event' in the editor) to receive executions."
                        )
                        print(warn_msg, flush=True)
                        logger.warning(warn_msg)
                        return False
                except Exception as test_exc:
                    logger.warning(f"[n8n] Test webhook attempt failed: {test_exc}")
                    return False

            err_msg = f"[n8n] Webhook returned non-success HTTP {response.status_code}: {response.text[:200]}"
            print(err_msg, flush=True)
            logger.warning(err_msg)
            return False

    except httpx.TimeoutException:
        print(f"[n8n] Webhook request to {target_url} timed out after 10 seconds.", flush=True)
        logger.warning(f"[n8n] Webhook request to {target_url} timed out after 10 seconds.")
        return False
    except Exception as exc:
        print(f"[n8n] Unexpected error sending webhook to {target_url}: {exc}", flush=True)
        logger.error(f"[n8n] Unexpected error sending webhook to {target_url}: {exc}", exc_info=True)
        return False


def process_student_registration_webhook(student_id: str, db: Optional[Session] = None, force: bool = False) -> bool:
    """
    Fetches the student from DB, builds the payload, and posts to n8n if not already dispatched recently.
    """
    now = time.time()
    last_dispatched = _dispatched_student_timestamps.get(student_id, 0.0)
    if not force and (now - last_dispatched) < DEDUP_COOLDOWN_SECONDS:
        print(f"[n8n] Student {student_id} was already notified via webhook {int(now - last_dispatched)}s ago. Skipping duplicate.", flush=True)
        logger.info(f"[n8n] Student {student_id} was already notified via webhook {int(now - last_dispatched)}s ago. Skipping duplicate.")
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
            _dispatched_student_timestamps[student_id] = now
        return success

    finally:
        if close_db_on_finish:
            db.close()


def trigger_student_registration_webhook(
    student_id: str,
    db: Optional[Session] = None,
    background_tasks: Optional[Any] = None,
    force: bool = False
) -> None:
    """
    Convenience entrypoint. Uses background_tasks when provided for non-blocking performance.
    """
    if background_tasks is not None and hasattr(background_tasks, "add_task"):
        background_tasks.add_task(process_student_registration_webhook, student_id, None, force)
    else:
        process_student_registration_webhook(student_id, db, force=force)



# =========================================================================
# SCHOLARSHIP ELIGIBILITY & EMAIL AUTOMATION WEBHOOK
# =========================================================================

def send_n8n_scholarship_webhook(payload: Dict[str, Any], webhook_url: Optional[str] = None) -> bool:
    """
    Sends the student profile to the n8n Scholarship Eligibility webhook via HTTP POST.
    Authentication: NONE (as specified).
    Never throws uncaught exceptions, ensuring database registration always succeeds.
    """
    target_url = webhook_url or settings.ASCEND_SCHOLARSHIP_WEBHOOK_URL
    if not settings.N8N_SCHOLARSHIP_WEBHOOK_ENABLED or not target_url:
        logger.info("[n8n-scholarship] Webhook is disabled or URL not configured. Skipping dispatch.")
        return False

    headers = {"Content-Type": "application/json"}

    try:
        msg = f"[n8n-scholarship] Dispatching scholarship check for {payload.get('name')} ({payload.get('email')}), study: '{payload.get('current_study')}', score: {payload.get('previous_percentage')}% to {target_url}"
        print(msg, flush=True)
        logger.info(msg)
        with httpx.Client(timeout=10.0) as client:
            response = client.post(target_url, json=payload, headers=headers)
            
            if response.is_success:
                succ_msg = f"[n8n-scholarship] Webhook successfully delivered: HTTP {response.status_code} - {response.text.strip()}"
                print(succ_msg, flush=True)
                logger.info(succ_msg)
                return True

            # If production webhook returns 404 (workflow not active), check test webhook if in editor
            if response.status_code == 404 and "/webhook/" in target_url:
                test_url = target_url.replace("/webhook/", "/webhook-test/")
                print(f"[n8n-scholarship] Production webhook returned 404. Attempting test webhook: {test_url}", flush=True)
                logger.info(f"[n8n-scholarship] Production webhook returned 404 (workflow inactive). Attempting test webhook: {test_url}")
                try:
                    test_response = client.post(test_url, json=payload, headers=headers)
                    if test_response.is_success:
                        succ_msg = f"[n8n-scholarship] Test webhook successfully delivered: HTTP {test_response.status_code} - {test_response.text.strip()}"
                        print(succ_msg, flush=True)
                        logger.info(succ_msg)
                        return True
                    else:
                        warn_msg = (
                            f"[n8n-scholarship] Both production and test webhooks returned 404.\n"
                            f"ACTION REQUIRED IN N8N: Please activate the workflow toggle in the top-right of your n8n canvas "
                            f"(or click 'Execute workflow' / 'Listen for test event' in the editor) to receive executions."
                        )
                        print(warn_msg, flush=True)
                        logger.warning(warn_msg)
                        return False
                except Exception as test_exc:
                    logger.warning(f"[n8n-scholarship] Test webhook attempt failed: {test_exc}")
                    return False

            err_msg = f"[n8n-scholarship] Webhook returned non-success HTTP {response.status_code}: {response.text[:200]}"
            print(err_msg, flush=True)
            logger.warning(err_msg)
            return False

    except httpx.TimeoutException:
        print(f"[n8n-scholarship] Webhook request to {target_url} timed out after 10 seconds.", flush=True)
        logger.warning(f"[n8n-scholarship] Webhook request to {target_url} timed out after 10 seconds.")
        return False
    except Exception as exc:
        print(f"[n8n-scholarship] Unexpected error sending webhook to {target_url}: {exc}", flush=True)
        logger.error(f"[n8n-scholarship] Unexpected error sending webhook to {target_url}: {exc}", exc_info=True)
        return False


def process_scholarship_eligibility_webhook(student_id: str, db: Optional[Session] = None, force: bool = False) -> bool:
    """
    Fetches the student from DB, builds the scholarship payload, and posts to n8n if not already dispatched recently.
    """
    now = time.time()
    last_dispatched = _dispatched_scholarship_timestamps.get(student_id, 0.0)
    if not force and (now - last_dispatched) < DEDUP_COOLDOWN_SECONDS:
        print(f"[n8n-scholarship] Student {student_id} was already evaluated for scholarships {int(now - last_dispatched)}s ago. Skipping duplicate.", flush=True)
        logger.info(f"[n8n-scholarship] Student {student_id} was already evaluated for scholarships {int(now - last_dispatched)}s ago. Skipping duplicate.")
        return False

    close_db_on_finish = False
    if db is None:
        db = SessionLocal()
        close_db_on_finish = True

    try:
        student = (
            db.query(Student)
            .options(
                joinedload(Student.academic_profile)
            )
            .filter(Student.id == student_id)
            .first()
        )

        if not student:
            logger.warning(f"[n8n-scholarship] Student with id {student_id} not found in database. Webhook aborted.")
            return False

        payload = build_scholarship_eligibility_payload(student)
        success = send_n8n_scholarship_webhook(payload)
        
        # Only mark as dispatched if webhook was successfully accepted by n8n
        if success:
            _dispatched_scholarship_student_ids.add(student_id)
            _dispatched_scholarship_timestamps[student_id] = now
        return success

    finally:
        if close_db_on_finish:
            db.close()


def trigger_scholarship_eligibility_webhook(
    student_id: str,
    db: Optional[Session] = None,
    background_tasks: Optional[Any] = None,
    force: bool = False
) -> None:
    """
    Convenience entrypoint for Scholarship Eligibility webhook.
    Uses background_tasks when provided for non-blocking performance.
    """
    if background_tasks is not None and hasattr(background_tasks, "add_task"):
        background_tasks.add_task(process_scholarship_eligibility_webhook, student_id, None, force)
    else:
        process_scholarship_eligibility_webhook(student_id, db, force=force)


