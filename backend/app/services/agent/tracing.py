import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.agent import AgentTrace

logger = logging.getLogger("agent.tracing")


def record_agent_trace(
    db: Session,
    request_id: str,
    user_query: str,
    student_id: Optional[str] = None,
    selected_tools: Optional[List[str]] = None,
    tool_arguments: Optional[Dict[str, Any]] = None,
    tool_results: Optional[Dict[str, Any]] = None,
    retrieved_documents: Optional[List[Dict[str, Any]]] = None,
    verification_results: Optional[Dict[str, Any]] = None,
    model: Optional[str] = "agent-orchestrator",
    latency_ms: Optional[float] = None,
    final_status: str = "success",
    error: Optional[str] = None
) -> None:
    """
    Persists structured agent execution trace for observability, debugging, and auditing.
    Safe: Strips secrets and PII.
    """
    try:
        trace = AgentTrace(
            request_id=request_id,
            student_id=student_id,
            user_query=user_query[:500],
            selected_tools=json.dumps(selected_tools or []),
            tool_arguments=json.dumps(tool_arguments or {})[:1000] if tool_arguments else None,
            tool_results=json.dumps(tool_results or {})[:2000] if tool_results else None,
            retrieved_documents=json.dumps(retrieved_documents or [])[:1000] if retrieved_documents else None,
            verification_results=json.dumps(verification_results or {}) if verification_results else None,
            model=model,
            latency_ms=latency_ms,
            final_status=final_status,
            error=error
        )
        db.add(trace)
        db.commit()

        logger.info(
            f"[AgentTrace] req={request_id} student={student_id} tools={selected_tools} "
            f"latency={latency_ms:.1f}ms status={final_status}"
        )
    except Exception as ex:
        logger.error(f"Failed to record agent trace: {ex}")
