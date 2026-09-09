from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.services.assistant_service import (
    ask_assistant,
    get_conversation_history,
    clear_conversation_history,
    get_student_memory,
    update_student_memory,
    clear_student_memory,
)

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's query to the AI Assistant")
    student_id: Optional[str] = Field(None, description="Optional ID of authenticated student")
    stage: Optional[str] = Field(None, description="Current education stage (class_10, intermediate, b_tech)")


class AssistantChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = []
    ai_generated: bool = False
    provider: Optional[str] = None
    student_context_loaded: bool = False
    student_name: Optional[str] = None
    education_stage: str
    history_length: int = 0
    memory: Optional[Dict[str, Any]] = None


class StudentMemoryUpdateRequest(BaseModel):
    study_goals: Optional[str] = Field(None, description="Personal study goals (e.g. 'Crack GATE 2026')")
    preferred_language: Optional[str] = Field(None, description="Preferred programming language (e.g. 'Python')")
    strong_subjects: Optional[str] = Field(None, description="Strong subjects (e.g. 'DSA, Mathematics')")
    weak_subjects: Optional[str] = Field(None, description="Weak subjects (e.g. 'Operating Systems, Chemistry')")
    career_interests: Optional[str] = Field(None, description="Target career interests (e.g. 'Backend Engineer')")
    study_schedule: Optional[str] = Field(None, description="Preferred study schedule (e.g. '2 hours daily after 7 PM')")


@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(
    payload: AssistantChatRequest,
    db: Session = Depends(get_db)
):
    """
    Sends message to Ascend AI Assistant with per-user memory isolation:
    - Queries OpenRouter API (falls back to Groq or deterministic engine).
    - Incorporates student's verified profile data and private personal memory.
    - Persists conversation turns into AssistantMessage memory for continuous context.
    - Enforces short, clear, and direct responses unless details are requested.
    """
    try:
        result = await ask_assistant(
            db=db,
            user_query=payload.message,
            student_id=payload.student_id,
            stage=payload.stage
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating assistant response: {str(e)}"
        )


@router.get("/history/{student_id}")
def get_chat_history(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves private stored conversation turns from memory for the student.
    Strictly isolated per student_id / userId.
    """
    history = get_conversation_history(db, student_id)
    return {
        "student_id": student_id,
        "count": len(history),
        "messages": history
    }


@router.delete("/history/{student_id}")
def clear_chat_history(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Clears private memory conversation history for the student.
    """
    success = clear_conversation_history(db, student_id)
    return {
        "student_id": student_id,
        "cleared": success
    }


@router.get("/memory/{student_id}")
def get_personal_memory(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves personal AI memory for the student:
    - Study goals
    - Preferred programming language
    - Weak and strong subjects
    - Career interests
    - Study schedule
    Strictly isolated per student_id / userId.
    """
    mem = get_student_memory(db, student_id)
    return {
        "student_id": student_id,
        "memory": mem
    }


@router.put("/memory/{student_id}")
def update_personal_memory(
    student_id: str,
    payload: StudentMemoryUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Updates personal AI memory attributes for the student.
    """
    updates = payload.model_dump(exclude_unset=True)
    updated_mem = update_student_memory(db, student_id, updates)
    return {
        "student_id": student_id,
        "updated": True,
        "memory": updated_mem
    }


@router.delete("/memory/{student_id}")
def delete_personal_memory(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Resets personal AI memory for the student.
    """
    cleared = clear_student_memory(db, student_id)
    return {
        "student_id": student_id,
        "cleared": cleared
    }
