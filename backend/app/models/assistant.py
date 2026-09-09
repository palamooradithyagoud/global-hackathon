import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class AssistantMessage(Base):
    """
    Stores conversation turns between student and Ascend AI Assistant.
    Provides persistent conversation history.
    """
    __tablename__ = "assistant_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=True, index=True)
    role = Column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=True)  # JSON string of follow-up chips
    created_at = Column(DateTime, default=now_utc, nullable=False)

    student = relationship("Student", backref="assistant_messages")


class AssistantMemory(Base):
    """
    Stores consolidated personal memory facts, goals, and context for each student.
    Enables Ascend AI to remember:
    - Study goals
    - Preferred programming language
    - Weak and strong subjects
    - Career interests
    - Study schedule
    Isolated per student_id / userId.
    """
    __tablename__ = "assistant_memories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Specific Personal AI Memory fields
    study_goals = Column(Text, nullable=True)
    preferred_language = Column(String(50), nullable=True)
    strong_subjects = Column(Text, nullable=True)
    weak_subjects = Column(Text, nullable=True)
    career_interests = Column(Text, nullable=True)
    study_schedule = Column(Text, nullable=True)
    
    # General summaries and dynamic key-value memories
    summary = Column(Text, nullable=True)
    extracted_facts = Column(Text, nullable=True)  # JSON string of facts
    last_interaction = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", backref="assistant_memory")
