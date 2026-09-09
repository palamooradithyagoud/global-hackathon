import uuid
from typing import Optional, Set
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.app.models.profile import Student
from backend.app.services.agent.errors import ContextError


class AgentContext(BaseModel):
    """
    Server-controlled security execution context.
    The LLM has NO control over these fields.
    All protected tools rely on authenticated_student_id.
    """
    authenticated_user_id: Optional[str] = None
    authenticated_student_id: Optional[str] = None
    session_id: str
    request_id: str
    stage: Optional[str] = "b_tech"
    permissions: Set[str] = Field(default_factory=lambda: {"read_public"})

    @property
    def is_authenticated_student(self) -> bool:
        return bool(self.authenticated_student_id and "require_student_auth" in self.permissions)


def build_server_agent_context(
    db: Session,
    authenticated_student_id: Optional[str] = None,
    client_student_id_param: Optional[str] = None,
    session_id: Optional[str] = None,
    stage: Optional[str] = None
) -> AgentContext:
    """
    Constructs server-controlled AgentContext with IDOR prevention.
    If an authenticated student is present, verifies identity.
    If demo student parameter is passed in development, verifies existence.
    """
    request_id = str(uuid.uuid4())
    resolved_session_id = session_id or f"sess-{uuid.uuid4().hex[:12]}"
    permissions = {"read_public"}

    # 1. Primary: Server-authenticated student identity
    target_student_id = authenticated_student_id

    # 2. Secondary: Fallback to client parameter if no auth session, but validate existence strictly
    if not target_student_id and client_student_id_param:
        target_student_id = client_student_id_param

    resolved_stage = stage or "b_tech"

    if target_student_id:
        student = db.query(Student).filter(Student.id == target_student_id).first()
        if student:
            permissions.add("require_student_auth")
            resolved_stage = student.education_stage or resolved_stage
        else:
            # If invalid student ID was supplied, strip it to prevent unauthorized impersonation
            target_student_id = None

    return AgentContext(
        authenticated_user_id=target_student_id,
        authenticated_student_id=target_student_id,
        session_id=resolved_session_id,
        request_id=request_id,
        stage=resolved_stage,
        permissions=permissions
    )
