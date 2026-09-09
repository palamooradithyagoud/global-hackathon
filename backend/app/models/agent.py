import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, ForeignKey, Text, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Skill(Base):
    """
    Canonical Skill Taxonomy Table.
    Normalizes synonymous skills (e.g. Python3, python -> Python).
    """
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)  # Programming, Frontend, Backend, Database, DevOps, AI/ML, Cloud, Core CS, Soft Skills
    aliases = Column(Text, nullable=True)  # JSON array of alternative names
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", index=True)  # active, deprecated
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    career_mappings = relationship("CareerSkill", back_populates="skill", cascade="all, delete-orphan")


class Career(Base):
    """
    High-value career pathways across tech, data, core engineering, and government.
    """
    __tablename__ = "careers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)  # Software & Web, Data & AI, Cloud & Systems, Core Engineering, Government / PSU
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    required_skills = relationship("CareerSkill", back_populates="career", cascade="all, delete-orphan")


class CareerSkill(Base):
    """
    Relational junction mapping Careers to required Skills with importance weights and target proficiencies.
    """
    __tablename__ = "career_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    career_id = Column(String(36), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    importance = Column(Float, default=1.0, nullable=False)  # 0.1 to 1.0
    target_level = Column(String(50), default="Intermediate", nullable=False)  # Beginner, Intermediate, Advanced
    created_at = Column(DateTime, default=now_utc, nullable=False)

    career = relationship("Career", back_populates="required_skills")
    skill = relationship("Skill", back_populates="career_mappings")

    __table_args__ = (
        UniqueConstraint("career_id", "skill_id", name="uq_career_skill"),
        Index("idx_career_skill_importance", "career_id", "importance"),
    )


class DurableMemory(Base):
    """
    User-scoped durable preference and context memory.
    Separates durable preferences from conversation messages and profile facts.
    """
    __tablename__ = "durable_memory"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), default="preference", index=True)  # preference, goal, constraint, learning_style
    key = Column(String(100), nullable=False, index=True)  # e.g. preferred_learning_style, course_budget, preferred_language
    value = Column(Text, nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)  # 0.0 to 1.0
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "key", name="uq_student_memory_key"),
        Index("idx_durable_memory_student_type", "student_id", "type"),
    )


class VerificationRecord(Base):
    """
    Evidence-backed factual verification log for externally sourced claims.
    """
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    claim = Column(Text, nullable=False)
    source = Column(String(255), nullable=True)  # e.g. "Official Scholarship Guidelines", "UGC Gazette"
    evidence = Column(Text, nullable=True)  # Exact quote or verifiable chunk
    source_url = Column(String(500), nullable=True)
    confidence = Column(Float, default=1.0)
    status = Column(String(50), default="verified", index=True)  # verified, unverified, uncertain, conflicting, expired
    verified_at = Column(DateTime, default=now_utc, nullable=False)


class AgentTrace(Base):
    """
    Structured execution trace for observability, auditing, and latency monitoring.
    Never exposes credentials or sensitive student PII.
    """
    __tablename__ = "agent_traces"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    request_id = Column(String(64), index=True, nullable=False)
    student_id = Column(String(36), nullable=True, index=True)
    user_query = Column(Text, nullable=False)
    selected_tools = Column(Text, nullable=True)  # JSON-encoded array of tool names
    tool_arguments = Column(Text, nullable=True)  # JSON-encoded arguments
    tool_results = Column(Text, nullable=True)  # JSON-encoded outputs
    retrieved_documents = Column(Text, nullable=True)  # JSON-encoded chunks
    verification_results = Column(Text, nullable=True)  # JSON-encoded verification status
    model = Column(String(100), nullable=True)
    latency_ms = Column(Float, nullable=True)
    final_status = Column(String(50), default="success")  # success, fallback, tool_error, timeout
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
