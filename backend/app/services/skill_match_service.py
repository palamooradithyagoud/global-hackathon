from typing import List, Dict, Any
from backend.app.services.skill_taxonomy import normalize_skill


PROFICIENCY_MAP = {
    "beginner": 1,
    "basic": 2,
    "intermediate": 3,
    "advanced": 4,
    "expert": 5
}

REVERSE_PROFICIENCY_MAP = {
    1: "Beginner",
    2: "Basic",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert"
}


def parse_proficiency_level(prof_str: Any) -> int:
    if isinstance(prof_str, int):
        return max(1, min(5, prof_str))
    if isinstance(prof_str, str):
        clean = prof_str.strip().lower()
        return PROFICIENCY_MAP.get(clean, 3)  # default to intermediate
    return 3


def calculate_skill_gap(
    student_skills: List[Dict[str, Any]],
    job_required_skills: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Deterministic skill gap analysis comparing normalized student skills against job requirements.
    Calculates matched, partial, missing, priority gaps, and overall readiness status.
    """
    # 1. Normalize student skills
    normalized_student_skills: Dict[str, Dict[str, Any]] = {}
    for sk in student_skills:
        raw_name = sk.get("skill_name") or sk.get("name") or str(sk)
        norm = normalize_skill(raw_name)
        norm_key = norm["normalized_name"]
        level = parse_proficiency_level(sk.get("proficiency") or sk.get("level"))
        
        # Keep highest level if duplicate normalized skills exist
        if norm_key not in normalized_student_skills or level > normalized_student_skills[norm_key]["level"]:
            normalized_student_skills[norm_key] = {
                "name": norm["name"],
                "normalized_name": norm_key,
                "category": norm["category"],
                "level": level,
                "level_label": REVERSE_PROFICIENCY_MAP.get(level, "Intermediate")
            }

    matched_skills = []
    partial_skills = []
    missing_skills = []

    # 2. Evaluate against each job required skill
    for req in job_required_skills:
        req_norm = normalize_skill(req.get("skill") or req.get("name", ""))
        req_key = req.get("normalized_skill") or req_norm["normalized_name"]
        req_display = req.get("skill") or req_norm["name"]
        req_level = parse_proficiency_level(req.get("required_proficiency") or req.get("required_level", 3))
        importance = req.get("importance", "medium")

        if req_key in normalized_student_skills:
            student_sk = normalized_student_skills[req_key]
            student_level = student_sk["level"]
            student_label = student_sk["level_label"]
            req_label = REVERSE_PROFICIENCY_MAP.get(req_level, "Intermediate")

            if student_level >= req_level:
                matched_skills.append({
                    "skill": req_display,
                    "normalized_skill": req_key,
                    "student_level": student_level,
                    "student_level_label": student_label,
                    "required_level": req_level,
                    "required_level_label": req_label,
                    "importance": importance
                })
            else:
                gap = req_level - student_level
                partial_skills.append({
                    "skill": req_display,
                    "normalized_skill": req_key,
                    "student_level": student_level,
                    "student_level_label": student_label,
                    "required_level": req_level,
                    "required_level_label": req_label,
                    "gap": gap,
                    "importance": importance
                })
        else:
            missing_skills.append({
                "skill": req_display,
                "normalized_skill": req_key,
                "student_level": 0,
                "student_level_label": "None",
                "required_level": req_level,
                "required_level_label": REVERSE_PROFICIENCY_MAP.get(req_level, "Intermediate"),
                "importance": importance
            })

    # 3. Calculate prioritized gaps (High importance missing skills first, then partials, then others)
    priority_gaps = []
    
    # Priority 1: Missing High Importance
    for m in missing_skills:
        if m["importance"] == "high":
            priority_gaps.append({
                "skill": m["skill"],
                "priority": "high",
                "reason": f"Core requirement for this role ({m['required_level_label']} proficiency needed)."
            })
            
    # Priority 2: Partial High Importance
    for p in partial_skills:
        if p["importance"] == "high":
            priority_gaps.append({
                "skill": p["skill"],
                "priority": "high",
                "reason": f"Needs advancement from {p['student_level_label']} to {p['required_level_label']} level."
            })

    # Priority 3: Missing Medium Importance
    for m in missing_skills:
        if m["importance"] != "high":
            priority_gaps.append({
                "skill": m["skill"],
                "priority": "medium" if m["importance"] == "medium" else "low",
                "reason": f"Desired capability for engineering deliverables ({m['required_level_label']} level)."
            })

    # Priority 4: Partial Medium Importance
    for p in partial_skills:
        if p["importance"] != "high":
            priority_gaps.append({
                "skill": p["skill"],
                "priority": "medium",
                "reason": f"Improve from {p['student_level_label']} to {p['required_level_label']}."
            })

    # 4. Overall Fit Classification
    total_reqs = len(job_required_skills) or 1
    matched_count = len(matched_skills)
    missing_high = [m for m in missing_skills if m["importance"] == "high"]

    if len(missing_high) == 0 and (matched_count / total_reqs) >= 0.65:
        status = "aligned"
        status_label = "Aligned"
    elif len(missing_skills) <= 2 and len(missing_high) <= 1:
        status = "needs_development"
        status_label = "Needs Development"
    else:
        status = "major_skill_gaps"
        status_label = "Major Skill Gaps"

    return {
        "matched_skills": matched_skills,
        "partial_skills": partial_skills,
        "missing_skills": missing_skills,
        "priority_gaps": priority_gaps,
        "status": status,
        "status_label": status_label,
        "summary_counts": {
            "matched": len(matched_skills),
            "partial": len(partial_skills),
            "missing": len(missing_skills),
            "total": total_reqs
        }
    }


def calculate_career_skill_gap_by_ids(
    student_id: str,
    career_id: str,
    db: Any
) -> Dict[str, Any]:
    """
    Deterministic skill gap analysis comparing authenticated student's profile skills
    against canonical Career required skills in PostgreSQL/SQLite.
    """
    from backend.app.models.profile import Student, StudentSkill
    from backend.app.models.agent import Career, CareerSkill

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {"error": f"Student with ID {student_id} not found."}

    career = db.query(Career).filter(Career.id == career_id).first()
    if not career:
        # Fallback: search by name/prefix
        career = db.query(Career).filter(Career.name.ilike(f"%{career_id}%")).first()
        if not career:
            return {"error": f"Career '{career_id}' not found."}

    # Extract student skills
    student_skills_list = []
    for s_skill in student.skills:
        student_skills_list.append({
            "skill_name": s_skill.skill_name,
            "proficiency": s_skill.proficiency
        })

    # Extract career required skills
    career_skills_records = db.query(CareerSkill).filter(CareerSkill.career_id == career.id).all()
    job_required_skills = []
    for cs in career_skills_records:
        s_name = cs.skill.name if cs.skill else "Unknown"
        imp_label = "high" if cs.importance >= 0.8 else ("medium" if cs.importance >= 0.5 else "low")
        job_required_skills.append({
            "skill": s_name,
            "required_proficiency": cs.target_level,
            "importance": imp_label,
            "raw_importance": cs.importance
        })

    gap_result = calculate_skill_gap(student_skills_list, job_required_skills)
    total_reqs = gap_result["summary_counts"]["total"]
    matched_count = gap_result["summary_counts"]["matched"]
    readiness_percentage = round((matched_count / max(1, total_reqs)) * 100, 1)

    return {
        "student_id": student.id,
        "student_name": student.name,
        "career_id": career.id,
        "career_name": career.name,
        "category": career.category,
        "readiness_percentage": readiness_percentage,
        "matched_skills": gap_result["matched_skills"],
        "partial_skills": gap_result["partial_skills"],
        "missing_skills": gap_result["missing_skills"],
        "priority_gaps": gap_result["priority_gaps"],
        "status": gap_result["status"],
        "status_label": gap_result["status_label"],
        "summary_counts": gap_result["summary_counts"]
    }


def calculate_skill_gap_for_career_name(
    student_id: str,
    career_name: str,
    db: Any
) -> Dict[str, Any]:
    """
    Deterministic skill gap analysis searching canonical careers by semantic name query.
    """
    from backend.app.models.agent import Career

    clean_name = career_name.strip()
    career = db.query(Career).filter(Career.name.ilike(f"%{clean_name}%")).first()
    if not career:
        # Common aliases
        aliases = {
            "ml engineer": "Machine Learning Engineer",
            "ai engineer": "AI Research Scientist",
            "sde": "Full Stack Developer",
            "frontend dev": "Frontend Engineer",
            "backend dev": "Backend Systems Engineer",
            "devops": "DevOps / SRE Engineer",
            "cloud engineer": "Cloud Solutions Architect",
            "data analyst": "Data Analyst"
        }
        mapped = aliases.get(clean_name.lower())
        if mapped:
            career = db.query(Career).filter(Career.name.ilike(f"%{mapped}%")).first()

    if not career:
        # Default to first available career in similar category or list available
        available = [c.name for c in db.query(Career).limit(5).all()]
        return {
            "error": f"Career '{career_name}' not found.",
            "available_careers": available
        }

    return calculate_career_skill_gap_by_ids(student_id, career.id, db)

