import pytest
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.profile import Student, Scholarship, AcademicProfile, StudentSkill
from backend.app.models.agent import Skill, Career, CareerSkill, DurableMemory
from backend.app.services.skill_taxonomy import normalize_skill
from backend.app.services.skill_match_service import calculate_skill_gap, calculate_career_skill_gap_by_ids
from backend.app.services.scholarship_matcher import check_scholarship_eligibility, find_eligible_scholarships
from backend.app.services.rag.retriever import search_knowledge_base
from backend.app.services.rag.ingestion import ingest_authoritative_corpus
from backend.app.services.agent.agent_context import AgentContext, build_server_agent_context
from backend.app.services.agent.tool_permissions import check_tool_permission
from backend.app.services.agent.errors import UnauthorizedToolError
from backend.app.services.agent.memory_manager import save_student_preference, get_student_memories
from backend.app.services.agent.verification import verify_factual_claim
from backend.app.services.agent.agent_orchestrator import agent_orchestrator
from backend.app.seeds.migrate_db import apply_migrations
from backend.app.seeds.seed_data import seed_database
from backend.app.seeds.agent_seed_data import seed_agent_data


@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# 1. UNIT TESTS: Skill Taxonomy & Normalization
# ============================================================================

def test_skill_normalization_canonical():
    res = normalize_skill("Python")
    assert res["name"] == "Python"
    assert res["category"] == "Programming"


def test_skill_normalization_synonyms_and_aliases():
    assert normalize_skill("python3")["name"] == "Python"
    assert normalize_skill("PYTHON")["name"] == "Python"
    assert normalize_skill("react.js")["name"] == "React"
    assert normalize_skill("k8s")["name"] == "Kubernetes"
    assert normalize_skill("fast api")["name"] == "FastAPI"


def test_skill_normalization_unregistered_fallback():
    res = normalize_skill("Quantum Computing Algorithms")
    assert "Quantum" in res["name"]
    assert res["normalized_name"] == "quantum_computing_algorithms"


# ============================================================================
# 2. UNIT TESTS: Deterministic Skill Gap Engine
# ============================================================================

def test_deterministic_skill_gap_calculation():
    student_skills = [
        {"skill_name": "Python", "proficiency": "Advanced"},
        {"skill_name": "React", "proficiency": "Intermediate"}
    ]
    required_skills = [
        {"skill": "Python", "required_proficiency": "Advanced", "importance": "high"},
        {"skill": "React", "required_proficiency": "Advanced", "importance": "high"},
        {"skill": "Docker", "required_proficiency": "Intermediate", "importance": "medium"}
    ]

    result = calculate_skill_gap(student_skills, required_skills)
    assert len(result["matched_skills"]) == 1
    assert result["matched_skills"][0]["skill"] == "Python"
    assert len(result["partial_skills"]) == 1
    assert result["partial_skills"][0]["skill"] == "React"
    assert len(result["missing_skills"]) == 1
    assert result["missing_skills"][0]["skill"] == "Docker"
    assert result["status"] in ("aligned", "needs_development", "major_skill_gaps")


def test_career_skill_gap_from_db(db_session):
    student = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    assert student is not None

    career = db_session.query(Career).filter(Career.name.ilike("%Machine Learning%")).first()
    assert career is not None

    gap = calculate_career_skill_gap_by_ids(student.id, career.id, db_session)
    assert "readiness_percentage" in gap
    assert "matched_skills" in gap
    assert "missing_skills" in gap
    assert gap["student_name"] == student.name


# ============================================================================
# 3. UNIT TESTS: Deterministic Scholarship Eligibility
# ============================================================================

def test_scholarship_eligibility_deterministic(db_session):
    student = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    assert student is not None

    scholarship = db_session.query(Scholarship).filter(Scholarship.id == "reliance-scholarship-btech-1st-year").first()
    if not scholarship:
        scholarship = db_session.query(Scholarship).first()

    eval_result = check_scholarship_eligibility(scholarship, student)
    assert "eligible" in eval_result
    assert isinstance(eval_result["matched_rules"], list)
    assert isinstance(eval_result["failed_rules"], list)
    assert "match_score" in eval_result


def test_find_eligible_scholarships_deterministic(db_session):
    student = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    assert student is not None

    results = find_eligible_scholarships(student, db_session, limit=5)
    assert isinstance(results, list)
    for r in results:
        assert r["eligible"] is True
        assert r["match_score"] >= 20


# ============================================================================
# 4. UNIT & INTEGRATION TESTS: Authoritative RAG Knowledge Base
# ============================================================================

def test_rag_ingestion_and_provenance():
    count = ingest_authoritative_corpus(force_reindex=False)
    assert count >= 15

    results = search_knowledge_base("National Means-cum-Merit Scholarship NMMS criteria", top_k=3)
    assert len(results) > 0
    top = results[0]
    assert top.source_url is not None
    assert top.last_verified is not None
    assert any("NMMS" in r.title or "12,000" in r.content or "NSP" in r.title for r in results)


def test_rag_telangana_epass_retrieval():
    results = search_knowledge_base("Telangana ePASS MeeSeva certificates required", top_k=2)
    assert len(results) > 0
    top = results[0]
    assert "ePASS" in top.title or "Telangana" in top.source or "MeeSeva" in top.content


# ============================================================================
# 5. SECURITY & IDOR TESTS: Server-Controlled Agent Context
# ============================================================================

def test_idor_prevention_server_context(db_session):
    # Attacker tries to pass another student's ID
    victim = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    assert victim is not None

    # Scenario: Server-authenticated session belongs to student A
    authenticated_id = "demo-student-uuid-002"
    attacker_supplied_param = victim.id

    context = build_server_agent_context(
        db=db_session,
        authenticated_student_id=authenticated_id,
        client_student_id_param=attacker_supplied_param
    )

    # Server must bind strictly to authenticated_student_id, NOT client parameter
    assert context.authenticated_student_id == authenticated_id
    assert context.authenticated_student_id != victim.id


def test_tool_permission_boundaries(db_session):
    # Anonymous context holds only 'read_public'
    anon_context = AgentContext(
        request_id="req-test-1",
        session_id="sess-anon",
        permissions={"read_public"}
    )

    # Public tools are allowed
    check_tool_permission("searchCareers", anon_context)
    check_tool_permission("searchKnowledgeBase", anon_context)

    # Protected student tools must raise UnauthorizedToolError
    with pytest.raises(UnauthorizedToolError):
        check_tool_permission("getStudentProfile", anon_context)

    with pytest.raises(UnauthorizedToolError):
        check_tool_permission("calculateSkillGap", anon_context)


# ============================================================================
# 6. MEMORY TESTS: User-Scoped Preferences & Correction
# ============================================================================

def test_durable_memory_persistence_and_correction(db_session):
    student = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    assert student is not None

    context = AgentContext(
        authenticated_student_id=student.id,
        request_id="req-mem-1",
        session_id="sess-1",
        permissions={"read_public", "require_student_auth"}
    )

    # 1. Initial statement: "I prefer Java"
    res1 = save_student_preference(context, key="preferred_language", value="Java", db=db_session)
    assert res1["value"] == "Java"

    # 2. Correction statement: "Now I prefer Rust"
    res2 = save_student_preference(context, key="preferred_language", value="Rust", db=db_session)
    assert res2["status"] == "updated"
    assert res2["value"] == "Rust"

    # 3. Recall
    mems = get_student_memories(context, db_session)
    assert mems["preferred_language"]["value"] == "Rust"


def test_durable_memory_user_isolation(db_session):
    student_a = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    student_b = db_session.query(Student).filter(Student.email == "demo.class10@skillcatalyst.dev").first()
    assert student_a and student_b

    ctx_a = AgentContext(authenticated_student_id=student_a.id, request_id="r1", session_id="s1", permissions={"require_student_auth"})
    ctx_b = AgentContext(authenticated_student_id=student_b.id, request_id="r2", session_id="s2", permissions={"require_student_auth"})

    save_student_preference(ctx_a, key="career_dream", value="AI Researcher", db=db_session)

    mems_b = get_student_memories(ctx_b, db_session)
    assert "career_dream" not in mems_b  # No leak across users


# ============================================================================
# 7. VERIFICATION TESTS: Evidence-Backed Claim Checking
# ============================================================================

def test_factual_claim_verification(db_session):
    # 1. Verified official claim
    res_true = verify_factual_claim("NMMS scholarship provides ₹12,000 per year", db_session)
    assert res_true["status"] == "verified"
    assert res_true["confidence"] >= 0.2

    # 2. Fabricated claim with no evidence
    res_fake = verify_factual_claim("Galactic Starfleet provides ₹50,00,000 to all high schoolers automatically", db_session)
    assert res_fake["status"] == "unverified"
    assert res_fake["confidence"] < 0.2


# ============================================================================
# 8. AGENT ORCHESTRATOR TESTS: Deterministic Fallback & Flows
# ============================================================================

import asyncio

def test_agent_orchestrator_deterministic_fallback_skill_gap(db_session):
    student = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    assert student is not None

    context = AgentContext(
        authenticated_student_id=student.id,
        request_id="req-test-flow-a",
        session_id="sess-test",
        stage="b_tech",
        permissions={"read_public", "require_student_auth"}
    )

    response = asyncio.run(agent_orchestrator.run(
        user_message="What skills am I missing to become an ML Engineer?",
        context=context,
        db=db_session
    ))

    assert response.reply is not None
    assert "Skill Gap Analysis" in response.reply or "Machine Learning" in response.reply
    assert "calculateSkillGap" in response.tools_used
    assert response.verification is not None
    assert len(response.suggestions) > 0


def test_agent_orchestrator_deterministic_fallback_scholarships(db_session):
    student = db_session.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
    assert student is not None

    context = AgentContext(
        authenticated_student_id=student.id,
        request_id="req-test-flow-b",
        session_id="sess-test",
        stage="b_tech",
        permissions={"read_public", "require_student_auth"}
    )

    response = asyncio.run(agent_orchestrator.run(
        user_message="Which scholarships can I apply for?",
        context=context,
        db=db_session
    ))

    assert response.reply is not None
    assert "findEligibleScholarships" in response.tools_used
    assert len(response.sources) > 0

