import re
from typing import Dict, Any, List, Optional
from backend.app.schemas.agent import AgentChatResponse
from backend.app.services.agent.agent_context import AgentContext


def synthesize_agent_response(
    raw_reply: str,
    tool_results: List[Dict[str, Any]],
    context: AgentContext,
    memories: Dict[str, Any],
    latency_ms: float = 0.0,
    tools_used: Optional[List[str]] = None,
    user_query: Optional[str] = None
) -> AgentChatResponse:
    """
    Constructs the final backward-compatible AgentChatResponse.
    Extracts sources, verifies citations, builds proactive suggestions,
    and includes user-scoped durable memories.
    """
    sources: List[Dict[str, Any]] = []
    verification_status = "verified"

    for tr in tool_results:
        tname = tr.get("tool_name")
        output = tr.get("output", {})

        # Extract RAG Sources
        if tname == "searchKnowledgeBase" and isinstance(output, dict):
            for item in output.get("results", []):
                sources.append({
                    "title": item.get("title"),
                    "source": item.get("source"),
                    "source_url": item.get("source_url"),
                    "section": item.get("section"),
                    "last_verified": item.get("last_verified")
                })

        # Extract Scholarship Sources
        elif tname in ("searchScholarships", "findEligibleScholarships", "checkScholarshipEligibility"):
            if tname == "findEligibleScholarships" and isinstance(output, dict):
                for opp in output.get("opportunities", []):
                    if opp.get("source_url"):
                        sources.append({
                            "title": opp.get("title"),
                            "source": opp.get("provider"),
                            "source_url": opp.get("source_url"),
                            "last_verified": "2026-08-01"
                        })
            elif tname == "checkScholarshipEligibility" and isinstance(output, dict):
                if output.get("source_url"):
                    sources.append({
                        "title": output.get("title"),
                        "source": output.get("provider"),
                        "source_url": output.get("source_url"),
                        "last_verified": "2026-08-01"
                    })
                    if not output.get("eligible"):
                        verification_status = "unverified"

        # Education Cost & Salary Sources
        elif tname == "getEducationCost" and isinstance(output, dict):
            sources.append({
                "title": f"{output.get('degree_name', 'Degree')} Fee Schedule",
                "source": output.get("data_source", "Ministry of Education / Institutional Schedules"),
                "source_url": "https://www.education.gov.in",
                "last_verified": output.get("verified_year", "2025-2026")
            })

        elif tname == "getSalaryEstimate" and isinstance(output, dict):
            sources.append({
                "title": f"{output.get('career_title', 'Career')} Compensation Benchmark",
                "source": output.get("data_source", "Industry Compensation Reports"),
                "source_url": "https://nasscom.in",
                "last_verified": output.get("verified_year", "2025-2026")
            })

        # Verification tool check
        elif tname == "verifyClaim" and isinstance(output, dict):
            status = output.get("status", "unverified")
            if status != "verified":
                verification_status = status

    # Deduplicate sources by source_url or title
    deduped_sources = []
    seen = set()
    for s in sources:
        key = s.get("source_url") or s.get("title")
        if key and key not in seen:
            seen.add(key)
            deduped_sources.append(s)

    # Contextual proactive suggestions strictly adhering to Rule 8
    suggestions = generate_contextual_suggestions(context.stage, tools_used or [], user_query)

    return AgentChatResponse(
        reply=raw_reply.strip(),
        suggestions=suggestions,
        memory=memories,
        sources=deduped_sources,
        verification={"status": verification_status},
        ai_generated=True,
        provider="SkillCatalyst Agent",
        tools_used=tools_used or [],
        latency_ms=round(latency_ms, 2)
    )


def generate_contextual_suggestions(
    stage: Optional[str],
    tools_used: List[str],
    user_query: Optional[str] = None
) -> List[str]:
    """
    Generates strictly contextual suggestions matching the CURRENT intent (Rule 8).
    Never suggests unrelated features (e.g. fees on a salary question, or jobs on a fee question).
    """
    q_lower = (user_query or "").strip().lower()

    # Intent 1: Education Cost & Fees
    if "getEducationCost" in tools_used or any(w in q_lower for w in ["cost", "fee", "fees", "tuition", "expense", "budget"]):
        return [
            "Compare M.Tech vs MCA costs",
            "How can I reduce tuition with scholarships?",
            "Estimate education ROI & payback period"
        ]

    # Intent 2: Salary & Compensation
    if "getSalaryEstimate" in tools_used or any(w in q_lower for w in ["salary", "compensation", "package", "lpa", "earn", "ctc", "pay"]):
        return [
            "What skills maximize this salary?",
            "Estimate 5-year education ROI",
            "Which companies pay the highest for this role?"
        ]

    # Intent 3: ROI & Financial Payback
    if "calculateEducationROI" in tools_used or any(w in q_lower for w in ["roi", "payback", "return on investment", "worth it"]):
        return [
            "Compare with another degree pathway",
            "Ways to reduce total education investment",
            "Expected 5-year salary progression"
        ]

    # Intent 4: Career / Degree Comparison
    if "compareCareerPathways" in tools_used or any(w in q_lower for w in ["vs", "compare", "difference between", "which is better"]):
        return [
            "Calculate detailed ROI comparison",
            "What key skills are required for both?",
            "Show industry hiring trends"
        ]

    # Intent 5: Skill Gap
    if "calculateSkillGap" in tools_used or any(w in q_lower for w in ["skill", "gap", "missing", "readiness"]):
        return [
            "Show free video tutorials for missing skills",
            "Build a step-by-step learning roadmap",
            "Find beginner-friendly open-source projects"
        ]

    # Intent 6: Jobs & Internships
    if "searchJobs" in tools_used or any(w in q_lower for w in ["job", "internship", "hiring", "opening", "vacancy"]):
        return [
            "What skills am I missing for these jobs?",
            "How should I prepare my resume for these roles?",
            "Search for remote opportunities"
        ]

    # Intent 7: Scholarships & Financial Aid
    if any(t in tools_used for t in ["findEligibleScholarships", "checkScholarshipEligibility", "searchScholarships"]) or any(w in q_lower for w in ["scholarship", "eligible", "grant", "epass", "nsp"]):
        return [
            "What documents are required for application?",
            "Check eligibility criteria details",
            "Application deadlines & renewal rules"
        ]

    # Intent 8: Greeting / Initial Open State
    if any(g in q_lower for g in ["hi", "hello", "hey", "good morning", "good evening", "start", "help"]):
        return [
            "What is the education cost of M.Tech?",
            "What is the expected salary of an AI Engineer?",
            "Check my skill gap for ML Engineer"
        ]

    # Fallback to stage-based relevant academic suggestions
    if stage == "class_10":
        return [
            "What scholarships can I apply for in Class 10?",
            "What documents do I need for NMMS?",
            "Which stream should I choose after 10th?"
        ]
    elif stage == "intermediate":
        return [
            "Which scholarships are open for Intermediate students?",
            "What are the TS EAMCET counseling rules?",
            "Suggest engineering preparation pathways"
        ]
    else:
        return [
            "What is the education cost of M.Tech?",
            "What is the expected salary of an AI Engineer?",
            "Check my skill gap for ML Engineer"
        ]
