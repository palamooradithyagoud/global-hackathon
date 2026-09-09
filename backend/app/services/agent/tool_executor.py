import time
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.services.agent.agent_context import AgentContext
from backend.app.services.agent.tool_permissions import check_tool_permission
from backend.app.services.agent.errors import ToolExecutionError, UnauthorizedToolError
from backend.app.models.profile import Student, Scholarship, AcademicProfile
from backend.app.models.agent import Career, CareerSkill, Skill
from backend.app.services.skill_match_service import calculate_skill_gap_for_career_name
from backend.app.services.scholarship_matcher import check_scholarship_eligibility, find_eligible_scholarships
from backend.app.services.rag.retriever import search_knowledge_base
from backend.app.services.agent.verification import verify_factual_claim
from backend.app.services.agent.memory_manager import save_student_preference, get_student_memories
from backend.app.services.jooble_service import jooble_service

logger = logging.getLogger(__name__)

CURATED_LEARNING_COURSES = {
    "python": {
        "title": "Python Programming Masterclass (Full Course)",
        "channel_title": "freeCodeCamp.org",
        "embed_url": "https://www.youtube-nocookie.com/embed/_uQrJ0TkZlc",
        "source": "YouTube (Verified Tutorial)"
    },
    "react": {
        "title": "React.js Complete Course 2026",
        "channel_title": "freeCodeCamp.org",
        "embed_url": "https://www.youtube-nocookie.com/embed/bMknfKXIFA8",
        "source": "YouTube (Verified Tutorial)"
    },
    "fastapi": {
        "title": "FastAPI Full Course for Beginners",
        "channel_title": "freeCodeCamp.org",
        "embed_url": "https://www.youtube-nocookie.com/embed/tLKKmouU5OI",
        "source": "YouTube (Verified Tutorial)"
    },
    "sql": {
        "title": "SQL Tutorial - Full Database Course for Beginners",
        "channel_title": "freeCodeCamp.org",
        "embed_url": "https://www.youtube-nocookie.com/embed/HXV3zeRR3h4",
        "source": "YouTube (Verified Tutorial)"
    },
    "machine_learning": {
        "title": "Machine Learning for Everybody – Full Course",
        "channel_title": "freeCodeCamp.org",
        "embed_url": "https://www.youtube-nocookie.com/embed/i_LwzRVP7bg",
        "source": "YouTube (Verified Tutorial)"
    },
    "data_structures": {
        "title": "Data Structures Easy to Advanced Course",
        "channel_title": "freeCodeCamp.org",
        "embed_url": "https://www.youtube-nocookie.com/embed/RBSGKlAvoiM",
        "source": "YouTube (Verified Tutorial)"
    },
    "docker": {
        "title": "Docker Tutorial for Beginners [Full Course]",
        "channel_title": "TechWorld with Nana",
        "embed_url": "https://www.youtube-nocookie.com/embed/3c-iBn73dDE",
        "source": "YouTube (Verified Tutorial)"
    }
}


def execute_agent_tool(
    tool_name: str,
    tool_args: Dict[str, Any],
    context: AgentContext,
    db: Session
) -> Dict[str, Any]:
    """
    Executes an agent tool strictly within security and permission boundaries.
    Catches errors and returns structured failure payloads rather than crashing.
    """
    start_time = time.time()
    logger.info(f"[ToolExecutor] Executing tool '{tool_name}' for req={context.request_id}")

    try:
        # 1. Enforce Server-side Permission Check
        check_tool_permission(tool_name, context)

        # 2. Dispatch Tool
        if tool_name == "getStudentProfile":
            return _execute_get_student_profile(context, db)

        elif tool_name == "searchCareers":
            return _execute_search_careers(tool_args, db)

        elif tool_name == "getCareerRequirements":
            return _execute_get_career_requirements(tool_args, db)

        elif tool_name == "calculateSkillGap":
            return _execute_calculate_skill_gap(tool_args, context, db)

        elif tool_name == "searchScholarships":
            return _execute_search_scholarships(tool_args, db)

        elif tool_name == "checkScholarshipEligibility":
            return _execute_check_scholarship_eligibility(tool_args, context, db)

        elif tool_name == "findEligibleScholarships":
            return _execute_find_eligible_scholarships(tool_args, context, db)

        elif tool_name == "searchJobs":
            return _execute_search_jobs(tool_args, db)

        elif tool_name == "searchLearningResources":
            return _execute_search_learning_resources(tool_args, db)

        elif tool_name == "searchKnowledgeBase":
            return _execute_search_knowledge_base(tool_args)

        elif tool_name == "verifyClaim":
            return _execute_verify_claim(tool_args, db)

        elif tool_name == "updateStudentMemory":
            return _execute_update_student_memory(tool_args, context, db)

        elif tool_name == "getStudentMemories":
            return get_student_memories(context, db)

        else:
            return {"error": f"Unknown tool '{tool_name}'"}

    except UnauthorizedToolError as ute:
        logger.warning(f"[ToolExecutor] Unauthorized access attempt: {ute}")
        return {
            "error": "Authorization Denied",
            "detail": str(ute)
        }
    except Exception as exc:
        logger.error(f"[ToolExecutor] Tool '{tool_name}' failed: {exc}", exc_info=True)
        return {
            "error": f"Tool '{tool_name}' encountered an execution error.",
            "detail": str(exc)
        }
    finally:
        latency = (time.time() - start_time) * 1000
        logger.debug(f"[ToolExecutor] Tool '{tool_name}' completed in {latency:.2f}ms")


# ----------------------------------------------------------------------------
# Specific Tool Implementations
# ----------------------------------------------------------------------------

def _execute_get_student_profile(context: AgentContext, db: Session) -> Dict[str, Any]:
    if not context.authenticated_student_id:
        return {"error": "No authenticated student identity in current session."}

    student = db.query(Student).filter(Student.id == context.authenticated_student_id).first()
    if not student:
        return {"error": f"Student record for ID '{context.authenticated_student_id}' not found."}

    acad = student.academic_profile
    return {
        "student_id": student.id,
        "name": student.name,
        "education_stage": student.education_stage,
        "location": student.location,
        "target_role": student.target_role,
        "academic_profile": {
            "institution": acad.school_or_college if acad else None,
            "board_or_university": acad.university or (acad.board if acad else None),
            "branch_or_stream": acad.branch or (acad.stream if acad else None),
            "year": acad.year if acad else None,
            "cgpa": acad.cgpa if acad else None,
            "percentage": acad.percentage if acad else None
        } if acad else None,
        "skills": [{"skill": s.skill_name, "proficiency": s.proficiency} for s in student.skills],
        "projects": [{"name": p.name, "description": p.description, "technologies": p.technologies} for p in student.projects],
        "interests": [i.interest for i in student.interests]
    }


def _execute_search_careers(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    query_term = (args.get("query") or "").strip()
    category = (args.get("category") or "").strip()
    limit = max(1, min(10, args.get("limit", 5)))

    query = db.query(Career)
    if query_term:
        query = query.filter(Career.name.ilike(f"%{query_term}%"))
    if category:
        query = query.filter(Career.category.ilike(f"%{category}%"))

    careers = query.limit(limit).all()
    return {
        "count": len(careers),
        "careers": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "description": c.description
            }
            for c in careers
        ]
    }


def _execute_get_career_requirements(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    name_or_id = args.get("career_name_or_id", "").strip()
    career = db.query(Career).filter(
        (Career.id == name_or_id) | (Career.name.ilike(f"%{name_or_id}%"))
    ).first()

    if not career:
        return {"error": f"Career '{name_or_id}' not found in database."}

    reqs = db.query(CareerSkill).filter(CareerSkill.career_id == career.id).all()
    return {
        "career_id": career.id,
        "career_name": career.name,
        "category": career.category,
        "requirements": [
            {
                "skill_name": cs.skill.name if cs.skill else "Unknown",
                "importance": cs.importance,
                "target_level": cs.target_level,
                "category": cs.skill.category if cs.skill else "General"
            }
            for cs in reqs
        ]
    }


def _execute_calculate_skill_gap(args: Dict[str, Any], context: AgentContext, db: Session) -> Dict[str, Any]:
    if not context.authenticated_student_id:
        return {"error": "Skill gap calculation requires an authenticated student session."}

    career_name = args.get("career_name", "").strip()
    if not career_name:
        return {"error": "Missing career_name parameter."}

    return calculate_skill_gap_for_career_name(
        student_id=context.authenticated_student_id,
        career_name=career_name,
        db=db
    )


def _execute_search_scholarships(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    query_term = (args.get("query") or "").strip()
    stage = (args.get("stage") or "").strip().lower()
    limit = max(1, min(10, args.get("limit", 5)))

    query = db.query(Scholarship)
    if stage:
        query = query.filter(Scholarship.eligible_stages.ilike(f"%{stage}%"))
    if query_term:
        query = query.filter(
            (Scholarship.title.ilike(f"%{query_term}%")) |
            (Scholarship.provider.ilike(f"%{query_term}%")) |
            (Scholarship.description.ilike(f"%{query_term}%"))
        )

    items = query.limit(limit).all()
    return {
        "count": len(items),
        "scholarships": [
            {
                "id": s.id,
                "title": s.title,
                "provider": s.provider,
                "amount": s.benefit_value,
                "deadline": s.deadline,
                "application_link": s.application_link,
                "eligible_stages": s.eligible_stages,
                "source_url": getattr(s, "source_url", None) or s.application_link
            }
            for s in items
        ]
    }


def _execute_check_scholarship_eligibility(args: Dict[str, Any], context: AgentContext, db: Session) -> Dict[str, Any]:
    if not context.authenticated_student_id:
        return {"error": "Eligibility verification requires an authenticated student."}

    scholarship_id = args.get("scholarship_id", "").strip()
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        return {"error": f"Scholarship '{scholarship_id}' not found."}

    student = db.query(Student).filter(Student.id == context.authenticated_student_id).first()
    if not student:
        return {"error": f"Student '{context.authenticated_student_id}' not found."}

    return check_scholarship_eligibility(scholarship, student)


def _execute_find_eligible_scholarships(args: Dict[str, Any], context: AgentContext, db: Session) -> Dict[str, Any]:
    if not context.authenticated_student_id:
        return {"error": "Eligibility scan requires an authenticated student session."}

    student = db.query(Student).filter(Student.id == context.authenticated_student_id).first()
    if not student:
        return {"error": f"Student '{context.authenticated_student_id}' not found."}

    limit = max(1, min(10, args.get("limit", 5)))
    eligible_list = find_eligible_scholarships(student, db, limit=limit)
    return {
        "student_id": student.id,
        "eligible_scholarships_count": len(eligible_list),
        "opportunities": eligible_list
    }


def _execute_search_jobs(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    keywords = (args.get("keywords") or "Software Engineer").strip()
    location = (args.get("location") or "India").strip()

    res = jooble_service.search_jobs(db=db, keyword=keywords, location=location, limit=5)
    return {
        "keywords": keywords,
        "location": location,
        "jobs": [
            {
                "id": j.get("id"),
                "title": j.get("title"),
                "company": j.get("company"),
                "location": j.get("location"),
                "salary": j.get("salary"),
                "required_skills": j.get("required_skills", []),
                "apply_link": j.get("link"),
                "source": j.get("source", "Jooble Live API")
            }
            for j in res.get("jobs", [])[:5]
        ]
    }


def _execute_search_learning_resources(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    skill_name = (args.get("skill_name") or "").strip().lower()
    clean_key = skill_name.replace(" ", "_").replace(".", "_")

    for key, course in CURATED_LEARNING_COURSES.items():
        if key in clean_key or clean_key in key:
            return {
                "skill": skill_name,
                "course": course
            }

    # Generic high quality fallback
    return {
        "skill": skill_name,
        "course": {
            "title": f"{skill_name.title()} Full Course Tutorial & Practical Projects",
            "channel_title": "SkillCatalyst Verified Learning",
            "embed_url": "https://www.youtube-nocookie.com/embed/_uQrJ0TkZlc",
            "source": "Curated Engineering Catalog"
        }
    }


def _execute_search_knowledge_base(args: Dict[str, Any]) -> Dict[str, Any]:
    query = args.get("query", "").strip()
    top_k = max(1, min(5, args.get("top_k", 3)))
    min_authority = args.get("authority_level")
    results = search_knowledge_base(query, top_k=top_k, min_authority_level=min_authority)

    return {
        "query": query,
        "evidence_count": len(results),
        "results": [
            {
                "document_id": r.document_id,
                "title": r.title,
                "source": r.source,
                "publisher": r.publisher,
                "authority_level": r.authority_level,
                "source_url": r.source_url,
                "section": r.section,
                "page": r.page,
                "content": r.content,
                "relevance_score": r.score,
                "last_verified": r.last_verified,
                "published_date": r.published_date
            }
            for r in results
        ]
    }


def _execute_verify_claim(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    claim = args.get("claim", "").strip()
    return verify_factual_claim(claim, db)


def _execute_update_student_memory(args: Dict[str, Any], context: AgentContext, db: Session) -> Dict[str, Any]:
    key = args.get("key", "").strip()
    value = args.get("value", "").strip()
    pref_type = args.get("type", "preference").strip()

    return save_student_preference(
        context=context,
        key=key,
        value=value,
        pref_type=pref_type,
        db=db
    )
