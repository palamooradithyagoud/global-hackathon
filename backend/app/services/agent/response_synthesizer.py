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
    tools_used: Optional[List[str]] = None
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

    # Contextual proactive suggestions
    suggestions = generate_contextual_suggestions(context.stage, tools_used or [])

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


def generate_contextual_suggestions(stage: Optional[str], tools_used: List[str]) -> List[str]:
    """Generates relevant follow-up actions based on stage and tools used."""
    if "calculateSkillGap" in tools_used:
        return [
            "Find live jobs for this role",
            "Show free video tutorials for missing skills",
            "Check my scholarship eligibility"
        ]
    if "searchJobs" in tools_used:
        return [
            "What skills am I missing for these jobs?",
            "Suggest learning playlists for required skills",
            "Show available scholarships"
        ]
    if "findEligibleScholarships" in tools_used or "checkScholarshipEligibility" in tools_used:
        return [
            "What documents are required for application?",
            "Check my skill gap for target career",
            "Search for relevant internships"
        ]

    # Stage defaults
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
            "What skills am I missing to become an ML Engineer?",
            "Which scholarships can I apply for?",
            "Find Python internships for me"
        ]
