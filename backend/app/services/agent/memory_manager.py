import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.agent import DurableMemory
from backend.app.services.agent.agent_context import AgentContext
from backend.app.services.agent.errors import UnauthorizedToolError

logger = logging.getLogger(__name__)


def get_student_memories(context: AgentContext, db: Session) -> Dict[str, Any]:
    """
    Retrieves all structured preferences for the authenticated student.
    Strictly user-scoped; returns empty dict if unauthenticated.
    """
    if not context.authenticated_student_id:
        return {}

    records = db.query(DurableMemory).filter(
        DurableMemory.student_id == context.authenticated_student_id
    ).all()

    memories = {}
    for r in records:
        memories[r.key] = {
            "value": r.value,
            "type": r.type,
            "confidence": r.confidence,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None
        }
    return memories


def save_student_preference(
    context: AgentContext,
    key: str,
    value: str,
    pref_type: str = "preference",
    confidence: float = 1.0,
    db: Session = None
) -> Dict[str, Any]:
    """
    Persists or updates a durable student preference.
    Supports correction (e.g. updating preferred_language from Java to Rust).
    """
    if not context.authenticated_student_id or not db:
        raise UnauthorizedToolError("Cannot persist durable memory for unauthenticated student session.")

    clean_key = key.strip().lower().replace(" ", "_")
    clean_val = value.strip()

    existing = db.query(DurableMemory).filter(
        DurableMemory.student_id == context.authenticated_student_id,
        DurableMemory.key == clean_key
    ).first()

    if existing:
        existing.value = clean_val
        existing.type = pref_type
        existing.confidence = confidence
        db.commit()
        db.refresh(existing)
        logger.info(f"Updated durable memory '{clean_key}' for student {context.authenticated_student_id}")
        return {
            "status": "updated",
            "key": clean_key,
            "value": clean_val,
            "confidence": confidence
        }
    else:
        new_mem = DurableMemory(
            student_id=context.authenticated_student_id,
            key=clean_key,
            value=clean_val,
            type=pref_type,
            confidence=confidence
        )
        db.add(new_mem)
        db.commit()
        db.refresh(new_mem)
        logger.info(f"Created new durable memory '{clean_key}' for student {context.authenticated_student_id}")
        return {
            "status": "created",
            "key": clean_key,
            "value": clean_val,
            "confidence": confidence
        }
