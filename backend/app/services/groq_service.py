import json
import logging
from typing import List, Dict, Any, Literal, Optional
from pydantic import BaseModel, Field
import groq
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class PriorityGap(BaseModel):
    skill: str
    priority: Literal["high", "medium", "low"]
    reason: str


class LearningStep(BaseModel):
    skill: str
    sequence: int
    focus: List[str]


class JobAnalysisAIInsight(BaseModel):
    summary: str
    strengths: List[str]
    priority_gaps: List[PriorityGap]
    learning_plan: List[LearningStep]
    project_recommendation: str
    ai_generated: bool = True


def build_fallback_insight(
    student_profile: Dict[str, Any],
    job: Dict[str, Any],
    deterministic_analysis: Dict[str, Any]
) -> JobAnalysisAIInsight:
    """
    Deterministic fallback when Groq API is temporarily unreachable or times out.
    Guarantees the frontend never breaks.
    """
    matched = deterministic_analysis.get("matched_skills", [])
    partial = deterministic_analysis.get("partial_skills", [])
    missing = deterministic_analysis.get("missing_skills", [])
    status = deterministic_analysis.get("status_label", "Needs Development")

    strengths = [
        f"Verified proficiency in {m['skill']} directly matches this role's requirements."
        for m in matched[:3]
    ]
    if not strengths:
        strengths = ["Strong core foundation in your B.Tech engineering curriculum."]

    priority_gaps: List[PriorityGap] = []
    learning_plan: List[LearningStep] = []

    # Build priority gaps from missing/partial skills
    idx = 1
    for m in missing[:3]:
        prio: Literal["high", "medium", "low"] = "high" if m.get("importance") == "high" else "medium"
        priority_gaps.append(PriorityGap(
            skill=m["skill"],
            priority=prio,
            reason=f"Required for {job.get('title', 'this role')} at {m.get('required_level_label', 'Intermediate')} level."
        ))
        learning_plan.append(LearningStep(
            skill=m["skill"],
            sequence=idx,
            focus=[f"{m['skill']} core concepts", f"Practical implementation with {job.get('title', 'backend/frontend')} architectures", "Best practices & testing"]
        ))
        idx += 1

    for p in partial[:2]:
        priority_gaps.append(PriorityGap(
            skill=p["skill"],
            priority="medium",
            reason=f"Advance from current {p.get('student_level_label', 'Beginner')} to required {p.get('required_level_label', 'Intermediate')} level."
        ))
        if idx <= 4:
            learning_plan.append(LearningStep(
                skill=p["skill"],
                sequence=idx,
                focus=[f"Advanced {p['skill']} patterns", "Performance optimization", "Production use cases"]
            ))
            idx += 1

    skills_to_bridge = [m["skill"] for m in missing[:3]] or ["Cloud Native APIs", "Database Optimization"]
    project_rec = (
        f"Build a full-stack {job.get('title', 'software engineering')} application combining your verified "
        f"strengths ({', '.join([m['skill'] for m in matched[:2]]) or 'Python'}) with "
        f"{', '.join(skills_to_bridge)} to demonstrate hands-on end-to-end competency."
    )

    summary = (
        f"Based on your B.Tech profile, this role is categorized as '{status}'. "
        f"Your foundation in {', '.join([m['skill'] for m in matched[:2]]) or 'core engineering'} is relevant, "
        f"with specific skill development recommended in {', '.join(skills_to_bridge[:2])}."
    )

    return JobAnalysisAIInsight(
        summary=summary,
        strengths=strengths,
        priority_gaps=priority_gaps,
        learning_plan=learning_plan,
        project_recommendation=project_rec,
        ai_generated=False
    )


async def generate_job_fit_insight(
    student_profile: Dict[str, Any],
    job: Dict[str, Any],
    deterministic_analysis: Dict[str, Any]
) -> JobAnalysisAIInsight:
    """
    Calls Groq to generate reasoning, personalized learning steps, and project recommendations
    strictly over verified deterministic backend facts.
    """
    if not settings.GROQ_API_KEY:
        logger.warning("[Groq] No GROQ_API_KEY configured. Returning deterministic fallback.")
        return build_fallback_insight(student_profile, job, deterministic_analysis)

    system_prompt = (
        "You are the SkillCatalyst AI Career Intelligence Engine for B.Tech engineering students in India.\n"
        "You receive VERIFIED, DETERMINISTIC facts computed by the backend comparing a student's profile to a job.\n"
        "RULES:\n"
        "1. DO NOT override or contradict the backend facts (matched, partial, missing skills, and readiness status).\n"
        "2. DO NOT invent fake salary numbers or unverified job qualifications.\n"
        "3. Provide realistic, encouraging, and actionable engineering advice tailored to Indian tech recruitment standards.\n"
        "4. Your response MUST be valid JSON conforming exactly to the requested schema."
    )

    user_payload = {
        "student_profile": {
            "name": student_profile.get("name"),
            "degree": "B.Tech Engineering",
            "branch": student_profile.get("branch", "Computer Science / IT"),
            "year": student_profile.get("year", "3rd / 4th Year"),
            "target_role": student_profile.get("target_role"),
            "skills": student_profile.get("skills", []),
            "projects": student_profile.get("projects", [])
        },
        "job_details": {
            "title": job.get("title"),
            "company": job.get("company"),
            "location": job.get("location", "India"),
            "salary": job.get("salary") or "Not disclosed in listing",
            "required_skills": job.get("required_skills", [])
        },
        "deterministic_verification": {
            "status": deterministic_analysis.get("status_label"),
            "matched_skills": deterministic_analysis.get("matched_skills", []),
            "partial_skills": deterministic_analysis.get("partial_skills", []),
            "missing_skills": deterministic_analysis.get("missing_skills", []),
            "priority_gaps": deterministic_analysis.get("priority_gaps", [])
        }
    }

    prompt = (
        f"Analyze this candidate-job fit using only the provided facts:\n"
        f"{json.dumps(user_payload, indent=2)}\n\n"
        f"Return a JSON object with this exact structure:\n"
        "{\n"
        '  "summary": "1-2 sentence overall fit synthesis explaining relevance and key gap",\n'
        '  "strengths": ["list of 2-3 specific reasons the student\'s verified skills are strong for this role"],\n'
        '  "priority_gaps": [{"skill": "SkillName", "priority": "high"|"medium"|"low", "reason": "concise explanation"}],\n'
        '  "learning_plan": [{"skill": "SkillName", "sequence": 1, "focus": ["topic 1", "topic 2", "topic 3"]}],\n'
        '  "project_recommendation": "1-2 sentence recommendation for a portfolio project bridging multiple skill gaps"\n'
        "}"
    )

    models_to_try = [settings.GROQ_MODEL, "groq/compound-mini"]

    for model_name in models_to_try:
        try:
            client = groq.Groq(api_key=settings.GROQ_API_KEY)
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1200,
                temperature=0.3
            )
            raw_content = completion.choices[0].message.content
            parsed = json.loads(raw_content)

            # Validate against Pydantic schema
            validated = JobAnalysisAIInsight(
                summary=parsed.get("summary", ""),
                strengths=parsed.get("strengths", []),
                priority_gaps=[
                    PriorityGap(
                        skill=p.get("skill", "Tech Skill"),
                        priority=p.get("priority", "medium"),
                        reason=p.get("reason", "Required engineering skill.")
                    )
                    for p in parsed.get("priority_gaps", [])
                ],
                learning_plan=[
                    LearningStep(
                        skill=s.get("skill", "Skill"),
                        sequence=int(s.get("sequence", idx + 1)),
                        focus=s.get("focus", ["Core fundamentals", "Hands-on projects"])
                    )
                    for idx, s in enumerate(parsed.get("learning_plan", []))
                ],
                project_recommendation=parsed.get("project_recommendation", ""),
                ai_generated=True
            )
            return validated
        except Exception as exc:
            logger.warning(f"[Groq] Call failed with model {model_name}: {exc}")

    # Fallback if both models fail
    logger.warning("[Groq] All Groq model attempts failed or timed out. Returning deterministic fallback.")
    return build_fallback_insight(student_profile, job, deterministic_analysis)
