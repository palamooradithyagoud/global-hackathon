import time
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import httpx

from backend.app.core.config import settings
from backend.app.schemas.agent import AgentChatResponse
from backend.app.services.agent.agent_context import AgentContext
from backend.app.services.agent.tool_schemas import AGENT_TOOLS_DEFINITIONS
from backend.app.services.agent.tool_executor import execute_agent_tool
from backend.app.services.agent.prompts import build_system_prompt_with_context
from backend.app.services.agent.response_synthesizer import synthesize_agent_response
from backend.app.services.agent.memory_manager import get_student_memories
from backend.app.services.agent.tracing import record_agent_trace

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 3


class AgentOrchestrator:
    """
    Production-Grade Grounded AI Agent Orchestrator.
    Manages intent understanding, tool execution loop, evidence verification,
    response synthesis, and deterministic fallback.
    """

    def __init__(self):
        self.max_iterations = MAX_TOOL_ITERATIONS

    async def run(
        self,
        user_message: str,
        context: AgentContext,
        db: Session,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> AgentChatResponse:
        start_time = time.time()
        logger.info(f"[AgentOrchestrator] Running request {context.request_id} for student '{context.authenticated_student_id}'")

        # 1. Load User-Scoped Durable Memories
        durable_memories = get_student_memories(context, db)

        # 2. Check if LLM API is available
        has_llm_key = bool(settings.GROQ_API_KEY or settings.OPENROUTER_API_KEY)
        if not has_llm_key:
            logger.info("[AgentOrchestrator] No LLM API key detected; executing deterministic rule fallback.")
            return await self._run_deterministic_fallback(user_message, context, db, durable_memories, start_time)

        # 3. Assemble Initial Prompt Messages
        system_prompt = build_system_prompt_with_context(
            stage=context.stage or "b_tech",
            student_name=None
        )

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt}
        ]

        # Inject memory preferences if any exist
        if durable_memories:
            mem_summary = ", ".join(f"{k}: {v['value']}" for k, v in durable_memories.items())
            messages.append({
                "role": "system",
                "content": f"[AUTHENTICATED USER PREFERENCES: {mem_summary}]"
            })

        # Bounded conversation history (last 4 messages)
        if conversation_history:
            for hist in conversation_history[-4:]:
                if hist.get("role") in ("user", "assistant"):
                    messages.append({"role": hist["role"], "content": hist.get("content", "")})

        # Append current user message
        messages.append({"role": "user", "content": user_message})

        tools_used: List[str] = []
        tool_results_log: List[Dict[str, Any]] = []
        iteration = 0

        try:
            while iteration < self.max_iterations:
                iteration += 1

                # Call LLM with native function calling
                response_message = await self._call_llm_with_tools(messages)
                if not response_message:
                    if iteration == 1 and not tool_results_log:
                        logger.info("[AgentOrchestrator] LLM did not return message on first turn; triggering deterministic fallback.")
                        return await self._run_deterministic_fallback(user_message, context, db, durable_memories, start_time)
                    break

                tool_calls = response_message.get("tool_calls")
                if not tool_calls:
                    # Final synthesis complete
                    final_text = response_message.get("content") or "I have processed your request based on verified backend data."
                    total_latency = (time.time() - start_time) * 1000

                    # Record trace
                    record_agent_trace(
                        db=db,
                        request_id=context.request_id,
                        user_query=user_message,
                        student_id=context.authenticated_student_id,
                        selected_tools=tools_used,
                        tool_results={"results": tool_results_log},
                        latency_ms=total_latency,
                        final_status="success"
                    )

                    return synthesize_agent_response(
                        raw_reply=final_text,
                        tool_results=tool_results_log,
                        context=context,
                        memories=durable_memories,
                        latency_ms=total_latency,
                        tools_used=tools_used
                    )

                # Execute all invoked tool calls
                messages.append(response_message)
                for tc in tool_calls:
                    tool_id = tc.get("id", f"call_{len(tools_used)}")
                    fn = tc.get("function", {})
                    tool_name = fn.get("name")
                    raw_args = fn.get("arguments", "{}")

                    try:
                        tool_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    except Exception:
                        tool_args = {}

                    tools_used.append(tool_name)
                    tool_output = execute_agent_tool(
                        tool_name=tool_name,
                        tool_args=tool_args,
                        context=context,
                        db=db
                    )

                    tool_results_log.append({
                        "tool_name": tool_name,
                        "args": tool_args,
                        "output": tool_output
                    })

                    # Feed result back to model
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_id,
                        "name": tool_name,
                        "content": json.dumps(tool_output)
                    })

            # Max iterations reached: synthesize with available results
            final_text = await self._synthesize_fallback_text(user_message, tool_results_log)
            total_latency = (time.time() - start_time) * 1000
            return synthesize_agent_response(
                raw_reply=final_text,
                tool_results=tool_results_log,
                context=context,
                memories=durable_memories,
                latency_ms=total_latency,
                tools_used=tools_used
            )

        except Exception as exc:
            logger.warning(f"[AgentOrchestrator] LLM loop encountered exception: {exc}; triggering deterministic fallback.")
            return await self._run_deterministic_fallback(user_message, context, db, durable_memories, start_time)

    async def _call_llm_with_tools(self, messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Calls Groq or OpenRouter with native tool-calling parameter support."""
        # 1. Try Groq
        if settings.GROQ_API_KEY:
            try:
                import groq
                client = groq.Groq(api_key=settings.GROQ_API_KEY, timeout=12.0)
                # Ensure tool-supported model on Groq
                model_to_use = "openai/gpt-oss-120b"
                completion = client.chat.completions.create(
                    model=model_to_use,
                    messages=messages,
                    tools=AGENT_TOOLS_DEFINITIONS,
                    tool_choice="auto",
                    temperature=0.2,
                    max_tokens=800
                )
                msg = completion.choices[0].message
                tool_calls_data = None
                if msg.tool_calls:
                    tool_calls_data = [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in msg.tool_calls
                    ]
                return {
                    "role": "assistant",
                    "content": msg.content or None,
                    "tool_calls": tool_calls_data
                }
            except Exception as e:
                logger.warning(f"[AgentOrchestrator] Groq tool call failed: {e}")

        # 2. Try OpenRouter
        if settings.OPENROUTER_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    headers = {
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    }
                    body = {
                        "model": settings.OPENROUTER_MODEL,
                        "messages": messages,
                        "tools": AGENT_TOOLS_DEFINITIONS,
                        "temperature": 0.2
                    }
                    resp = await client.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=body)
                    if resp.status_code == 200:
                        data = resp.json()
                        msg = data["choices"][0]["message"]
                        return {
                            "role": "assistant",
                            "content": msg.get("content") or "",
                            "tool_calls": msg.get("tool_calls")
                        }
            except Exception as e:
                logger.warning(f"[AgentOrchestrator] OpenRouter tool call failed: {e}")

        return None

    async def _run_deterministic_fallback(
        self,
        user_message: str,
        context: AgentContext,
        db: Session,
        durable_memories: Dict[str, Any],
        start_time: float
    ) -> AgentChatResponse:
        """
        Deterministic Rule-Based Fallback.
        Guarantees that skill-gap calculations, scholarship eligibility, jobs,
        and RAG evidence searches function 100% reliably even without LLM access.
        """
        msg_lower = user_message.lower()
        tool_results_log = []
        tools_used = []
        reply_lines = []

        # Flow A: Skill Gap
        if any(w in msg_lower for w in ["skill", "gap", "missing", "become", "career", "role"]):
            target_career = "Machine Learning Engineer"
            if "full stack" in msg_lower or "web" in msg_lower or "react" in msg_lower:
                target_career = "Full Stack Developer"
            elif "cloud" in msg_lower or "devops" in msg_lower:
                target_career = "Cloud Solutions Architect"
            elif "data" in msg_lower:
                target_career = "Data Analyst"

            if context.authenticated_student_id:
                tools_used.append("calculateSkillGap")
                gap = execute_agent_tool("calculateSkillGap", {"career_name": target_career}, context, db)
                tool_results_log.append({"tool_name": "calculateSkillGap", "output": gap})

                if "error" not in gap:
                    reply_lines.append(f"### Skill Gap Analysis for **{gap.get('career_name')}**\n")
                    reply_lines.append(f"- **Current Readiness**: {gap.get('readiness_percentage', 0)}% ({gap.get('status_label')})")
                    reply_lines.append(f"- **Verified Matched Skills**: {', '.join(m['skill'] for m in gap.get('matched_skills', [])) or 'None yet'}")
                    reply_lines.append(f"- **Missing Skills to Master**: {', '.join(m['skill'] for m in gap.get('missing_skills', [])) or 'None'}")
                    if gap.get("priority_gaps"):
                        p_reasons = "\n".join(f"  • **{p['skill']}** ({p['priority'].title()} priority): {p['reason']}" for p in gap["priority_gaps"][:3])
                        reply_lines.append(f"\n**High Priority Action Items**:\n{p_reasons}")
                else:
                    reply_lines.append(f"Could not calculate skill gap: {gap.get('error')}")
            else:
                tools_used.append("getCareerRequirements")
                reqs = execute_agent_tool("getCareerRequirements", {"career_name_or_id": target_career}, context, db)
                tool_results_log.append({"tool_name": "getCareerRequirements", "output": reqs})
                reply_lines.append(f"### Required Skills for **{target_career}**\n")
                if "requirements" in reqs:
                    for r in reqs["requirements"][:5]:
                        reply_lines.append(f"- **{r['skill_name']}** ({r['target_level']}) — Importance: {r['importance']}")

        # Flow B: Scholarships & Eligibility
        elif any(w in msg_lower for w in ["scholarship", "eligible", "grant", "funding", "epass", "nsp"]):
            if context.authenticated_student_id:
                tools_used.append("findEligibleScholarships")
                s_res = execute_agent_tool("findEligibleScholarships", {"limit": 4}, context, db)
                tool_results_log.append({"tool_name": "findEligibleScholarships", "output": s_res})

                opps = s_res.get("opportunities", [])
                if opps:
                    reply_lines.append("### Verified Eligible Scholarships for Your Profile\n")
                    for opp in opps:
                        reply_lines.append(f"**{opp['title']}** ({opp['provider']})")
                        reply_lines.append(f"- **Benefit**: {opp['amount']} | **Deadline**: {opp['deadline']}")
                        reply_lines.append(f"- **Official Portal**: [{opp['provider']}]({opp['source_url']})")
                        if opp.get("matched_rules"):
                            reply_lines.append(f"- **Matched Criteria**: {'; '.join(opp['matched_rules'][:2])}")
                        reply_lines.append("")
                else:
                    reply_lines.append("No scholarships matched your current profile criteria. Consider updating your income and academic records.")
            else:
                tools_used.append("searchScholarships")
                s_res = execute_agent_tool("searchScholarships", {"stage": context.stage or "b_tech", "limit": 4}, context, db)
                tool_results_log.append({"tool_name": "searchScholarships", "output": s_res})
                reply_lines.append("### Available Verified Scholarships\n")
                for s in s_res.get("scholarships", []):
                    reply_lines.append(f"- **{s['title']}** ({s['provider']}) — {s['amount']} | Deadline: {s['deadline']}")

        # Flow C: Jobs & Internships
        elif any(w in msg_lower for w in ["job", "internship", "hiring", "vacancy", "opening"]):
            kw = "Python Developer Intern" if "python" in msg_lower else ("React Developer" if "react" in msg_lower else "Software Engineer")
            tools_used.append("searchJobs")
            j_res = execute_agent_tool("searchJobs", {"keywords": kw, "location": "India"}, context, db)
            tool_results_log.append({"tool_name": "searchJobs", "output": j_res})

            jobs = j_res.get("jobs", [])
            reply_lines.append(f"### Live Job Opportunities for **{kw}**\n")
            for j in jobs[:4]:
                reply_lines.append(f"- **{j['title']}** at **{j['company']}** ({j['location']})")
                if j.get("salary"):
                    reply_lines.append(f"  • *Compensation*: {j['salary']}")
                reply_lines.append(f"  • [Apply on {j['source']}]({j['apply_link']})")

        # Flow D: RAG Knowledge / Documents
        elif any(w in msg_lower for w in ["document", "rule", "guideline", "nmms", "requirement", "gate", "eamcet"]):
            tools_used.append("searchKnowledgeBase")
            rag_res = execute_agent_tool("searchKnowledgeBase", {"query": user_message, "top_k": 3}, context, db)
            tool_results_log.append({"tool_name": "searchKnowledgeBase", "output": rag_res})

            evs = rag_res.get("results", [])
            if evs:
                top_ev = evs[0]
                reply_lines.append(f"### Official Verified Guidelines: {top_ev['title']}\n")
                reply_lines.append(top_ev["content"])
                reply_lines.append(f"\n*Source: [{top_ev['source']}]({top_ev['source_url']}) (Verified: {top_ev['last_verified']})*")
            else:
                reply_lines.append("No authoritative official documentation found for this specific query.")

        # Flow E: Profile
        elif any(w in msg_lower for w in ["profile", "who am i", "my details", "my skills"]):
            tools_used.append("getStudentProfile")
            p_res = execute_agent_tool("getStudentProfile", {}, context, db)
            tool_results_log.append({"tool_name": "getStudentProfile", "output": p_res})

            if "error" not in p_res:
                reply_lines.append(f"### Student Profile: **{p_res.get('name')}**\n")
                reply_lines.append(f"- **Stage**: {p_res.get('education_stage')} | **Location**: {p_res.get('location')}")
                acad = p_res.get("academic_profile") or {}
                reply_lines.append(f"- **Academic**: {acad.get('institution')} ({acad.get('branch_or_stream')}) — CGPA: {acad.get('cgpa')}")
                reply_lines.append(f"- **Skills**: {', '.join(s['skill'] for s in p_res.get('skills', []))}")
            else:
                reply_lines.append(p_res["error"])

        else:
            reply_lines.append(
                "Hello! I am the SkillCatalyst Grounded AI Agent. I can help you with:\n"
                "1. **Deterministic Skill Gap Analysis** (e.g. *'What skills am I missing to become an ML Engineer?'*)\n"
                "2. **Verified Scholarship Eligibility** (e.g. *'Which scholarships can I apply for?'*)\n"
                "3. **Live Job & Internship Matching** (e.g. *'Find Python internships for me'*)\n"
                "4. **Official Guidelines & Documents** (e.g. *'What documents are required for NMMS?'*)"
            )

        total_latency = (time.time() - start_time) * 1000
        raw_text = "\n".join(reply_lines)

        record_agent_trace(
            db=db,
            request_id=context.request_id,
            user_query=user_message,
            student_id=context.authenticated_student_id,
            selected_tools=tools_used,
            tool_results={"results": tool_results_log},
            latency_ms=total_latency,
            final_status="fallback"
        )

        return synthesize_agent_response(
            raw_reply=raw_text,
            tool_results=tool_results_log,
            context=context,
            memories=durable_memories,
            latency_ms=total_latency,
            tools_used=tools_used
        )

    async def _synthesize_fallback_text(self, query: str, tool_results: List[Dict[str, Any]]) -> str:
        """Synthesizes text from completed tool results if loop exits without explicit assistant text."""
        lines = []
        for tr in tool_results:
            tname = tr.get("tool_name")
            output = tr.get("output", {})
            if tname == "calculateSkillGap" and "career_name" in output:
                lines.append(f"Skill Gap for {output['career_name']}: {output.get('readiness_percentage')}% match.")
            elif tname == "findEligibleScholarships":
                lines.append(f"Found {output.get('eligible_scholarships_count', 0)} verified eligible scholarships.")
            elif tname == "searchJobs":
                lines.append(f"Found {len(output.get('jobs', []))} active job listings.")
        return "\n".join(lines) if lines else "Request processed through verified backend tools."


# Global singleton instance
agent_orchestrator = AgentOrchestrator()
