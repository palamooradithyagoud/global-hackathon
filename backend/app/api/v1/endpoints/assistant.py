import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.assistant import AssistantMessage
from backend.app.services.assistant_service import (
    ask_assistant,
    get_conversation_history,
    clear_conversation_history,
    get_student_memory,
    update_student_memory,
    clear_student_memory,
    extract_memory_from_query,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])



class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's query to the AI Assistant")
    student_id: Optional[str] = Field(None, description="Optional ID of authenticated student")
    stage: Optional[str] = Field(None, description="Current education stage (class_10, intermediate, b_tech)")


from backend.app.services.agent import agent_orchestrator, build_server_agent_context
from backend.app.models.profile import Student

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
    sources: Optional[List[Dict[str, Any]]] = None
    verification: Optional[Dict[str, Any]] = None
    tools_used: Optional[List[str]] = None
    latency_ms: Optional[float] = None


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
    SkillCatalyst Grounded AI Agent Chatbot:
    - Server-controlled AgentContext prevents IDOR and unauthorized access.
    - Native typed tools: Skill Engine, Scholarship Engine, Live Jobs, RAG, Verification, Memory.
    - Ground-truth evidence verification; never hallucinates unverified claims.
    - Gracefully degrades to deterministic rule engines if external LLM is offline.
    """
    try:
        # 1. Construct server-controlled execution context (IDOR defense)
        context = build_server_agent_context(
            db=db,
            authenticated_student_id=None,
            client_student_id_param=payload.student_id,
            stage=payload.stage
        )

        student_name = None
        if context.authenticated_student_id:
            student = db.query(Student).filter(Student.id == context.authenticated_student_id).first()
            if student:
                student_name = student.name

        # 2. Run Grounded Agent Orchestrator
        agent_res = await agent_orchestrator.run(
            user_message=payload.message,
            context=context,
            db=db
        )

        # 3. Synchronize legacy conversation history & memory for backward compatibility
        history_len = 0
        if context.authenticated_student_id:
            try:
                # Sync legacy AssistantMemory
                new_facts = extract_memory_from_query(payload.message)
                if new_facts:
                    update_student_memory(db, context.authenticated_student_id, new_facts)

                # Sync legacy AssistantMessage turns
                user_msg_rec = AssistantMessage(
                    student_id=context.authenticated_student_id,
                    role="user",
                    content=payload.message,
                    suggestions=None
                )
                ai_msg_rec = AssistantMessage(
                    student_id=context.authenticated_student_id,
                    role="assistant",
                    content=agent_res.reply,
                    suggestions=json.dumps(agent_res.suggestions)
                )
                db.add(user_msg_rec)
                db.add(ai_msg_rec)
                db.commit()

                history_len = (
                    db.query(AssistantMessage)
                    .filter(AssistantMessage.student_id == context.authenticated_student_id)
                    .count()
                )
            except Exception as e:
                db.rollback()
                logger.warning(f"Error syncing legacy chat history/memory: {e}")

        return AssistantChatResponse(
            reply=agent_res.reply,
            suggestions=agent_res.suggestions,
            ai_generated=agent_res.ai_generated,
            provider=agent_res.provider,
            student_context_loaded=bool(context.authenticated_student_id),
            student_name=student_name,
            education_stage=context.stage or "b_tech",
            history_length=history_len,
            memory=agent_res.memory,
            sources=agent_res.sources,
            verification=agent_res.verification,
            tools_used=agent_res.tools_used,
            latency_ms=agent_res.latency_ms
        )

    except Exception as exc:
        # Safe fallback to existing assistant service if catastrophic error
        try:
            result = await ask_assistant(
                db=db,
                user_query=payload.message,
                student_id=payload.student_id,
                stage=payload.stage
            )
            return AssistantChatResponse(
                reply=result.reply,
                suggestions=result.suggestions,
                ai_generated=result.ai_generated,
                provider=result.provider,
                student_context_loaded=result.student_context_loaded,
                student_name=result.student_name,
                education_stage=result.education_stage,
                history_length=result.history_length,
                memory=result.memory
            )
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
