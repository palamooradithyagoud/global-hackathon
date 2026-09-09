from typing import Optional, List, Dict, Any, Set
from pydantic import BaseModel, Field
from datetime import datetime


# ============================================================================
# 1. Server-Controlled Execution Context (IDOR Proof)
# ============================================================================

class AgentContext(BaseModel):
    """
    Controlled context populated by the server authentication layer.
    The LLM has NO control over these fields.
    """
    authenticated_user_id: Optional[str] = None
    student_id: Optional[str] = None
    session_id: str = "anon-session"
    request_id: str
    stage: Optional[str] = "b_tech"
    permissions: Set[str] = Field(default_factory=lambda: {"read_public"})


# ============================================================================
# 2. Tool Input & Output Schemas
# ============================================================================

# --- Career & Skill Tools ---

class CareerSummary(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str] = None


class CareerRequirementItem(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    importance: float
    target_level: str


class CareerRequirementsToolOutput(BaseModel):
    career_id: str
    career_name: str
    category: str
    requirements: List[CareerRequirementItem]


class SkillGapItem(BaseModel):
    skill_name: str
    category: str
    importance: float
    student_level: Optional[str] = None
    target_level: str
    status: str  # "matched", "partial", "missing"


class SkillGapToolOutput(BaseModel):
    career: str
    matched_skills: List[str]
    missing_skills: List[str]
    partial_skills: List[str]
    priority_skills: List[str]
    match_percentage: float
    details: List[SkillGapItem]


# --- Scholarship Tools ---

class ScholarshipItem(BaseModel):
    id: str
    title: str
    provider: str
    amount_inr: Optional[int] = None
    benefit_value: str
    deadline: str
    application_link: Optional[str] = None
    source_url: Optional[str] = None
    current_study: Optional[str] = None
    min_cgpa: Optional[float] = None
    max_income: Optional[float] = None
    eligible_stages: List[str]
    status: str = "verified"
    last_verified: Optional[str] = None


class EligibilityCheckRule(BaseModel):
    criterion: str
    student_value: Any
    required_value: Any
    passed: bool
    explanation: str


class EligibilityToolOutput(BaseModel):
    scholarship_id: str
    scholarship_title: str
    eligible: bool
    match_score: int
    matched_rules: List[EligibilityCheckRule]
    failed_rules: List[EligibilityCheckRule]
    missing_information: List[str] = []


# --- Job Tools ---

class JobResultItem(BaseModel):
    id: str
    title: str
    company: str
    location: str
    remote: bool = False
    salary: Optional[str] = None
    required_skills: List[str] = []
    apply_link: Optional[str] = None
    source: str
    posted_at: Optional[str] = None
    is_live: bool = True


# --- Learning Resource Tools ---

class LearningResourceItem(BaseModel):
    id: str
    title: str
    skill: str
    channel_title: Optional[str] = None
    embed_url: Optional[str] = None
    thumbnail: Optional[str] = None
    type: str = "playlist"  # playlist, video, course
    source: str = "YouTube"


# --- RAG Knowledge Base Tools ---

class KnowledgeSearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    source: str
    source_url: Optional[str] = None
    section: Optional[str] = None
    page: Optional[int] = None
    content: str
    relevance_score: float
    last_verified: Optional[str] = None


# --- Verification Tool ---

class VerificationToolOutput(BaseModel):
    claim: str
    status: str  # "verified", "unverified", "uncertain", "conflicting", "expired"
    confidence: float
    source: Optional[str] = None
    evidence: Optional[str] = None
    source_url: Optional[str] = None
    verified_at: str


# ============================================================================
# 3. Agent Chat Request & Response Models (Backward Compatible)
# ============================================================================

class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User query to the Agent")
    student_id: Optional[str] = Field(None, description="Optional student ID from client session")
    stage: Optional[str] = Field(None, description="Education stage: class_10, intermediate, b_tech")
    session_id: Optional[str] = Field(None, description="Session ID for client continuity")


class AgentChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = Field(default_factory=list)
    memory: Optional[Dict[str, Any]] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    verification: Optional[Dict[str, Any]] = None
    ai_generated: bool = True
    provider: str = "agent"
    tools_used: List[str] = Field(default_factory=list)
    latency_ms: Optional[float] = None
