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
from backend.app.services.agent.tool_permissions import get_authorized_tools_definitions
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
        has_llm_key = bool(settings.GROQ_API_KEY or settings.GEMINI_API_KEY or settings.OPENROUTER_API_KEY)
        if not has_llm_key:
            logger.info("[AgentOrchestrator] No LLM API key detected; executing deterministic rule fallback.")
            return await self._run_deterministic_fallback(user_message, context, db, durable_memories, start_time)

        # 3. Assemble Initial Prompt Messages
        is_auth = bool(context.authenticated_student_id)
        system_prompt = build_system_prompt_with_context(
            stage=context.stage or "b_tech",
            student_name=None,
            is_authenticated=is_auth
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

                # On turn 2+, if tools have already been executed, force final synthesis
                allow_tools = bool(iteration == 1 and not tools_used)

                # Call LLM with native function calling
                response_message = await self._call_llm_with_tools(messages, allow_tools=allow_tools, context=context)
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
                        tools_used=tools_used,
                        user_query=user_message
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

            # Max iterations reached or tool loop completed: synthesize rich response with available results
            final_res = await self._call_llm_with_tools(messages, allow_tools=False, context=context)
            if final_res and final_res.get("content"):
                final_text = final_res["content"]
            else:
                final_text = await self._synthesize_fallback_text(user_message, tool_results_log)

            total_latency = (time.time() - start_time) * 1000
            return synthesize_agent_response(
                raw_reply=final_text,
                tool_results=tool_results_log,
                context=context,
                memories=durable_memories,
                latency_ms=total_latency,
                tools_used=tools_used,
                user_query=user_message
            )

        except Exception as exc:
            logger.warning(f"[AgentOrchestrator] LLM loop encountered exception: {exc}; triggering deterministic fallback.")
            return await self._run_deterministic_fallback(user_message, context, db, durable_memories, start_time)

    async def _call_llm_with_tools(
        self,
        messages: List[Dict[str, Any]],
        allow_tools: bool = True,
        context: Optional[AgentContext] = None
    ) -> Optional[Dict[str, Any]]:
        """Calls Groq or OpenRouter with native tool-calling parameter support."""
        tools_list = get_authorized_tools_definitions(context, AGENT_TOOLS_DEFINITIONS) if context else AGENT_TOOLS_DEFINITIONS

        # 1. Try Groq with active candidate models and graceful rate-limit failover
        if settings.GROQ_API_KEY:
            models_to_try = [
                settings.GROQ_MODEL,
                "qwen/qwen3.8-27b",
                "openai/gpt-oss-20b",
                "qwen/qwen3.6-27b",
                "openai/gpt-oss-120b"
            ]
            seen_models = set()
            candidate_models = []
            for m in models_to_try:
                if m and m not in seen_models:
                    seen_models.add(m)
                    candidate_models.append(m)

            for model_to_use in candidate_models:
                try:
                    import groq
                    client = groq.Groq(api_key=settings.GROQ_API_KEY, timeout=14.0)
                    kwargs = {
                        "model": model_to_use,
                        "messages": messages,
                        "temperature": 0.3,
                        "max_tokens": 500
                    }
                    if allow_tools and tools_list:
                        kwargs["tools"] = tools_list
                        kwargs["tool_choice"] = "auto"

                    completion = client.chat.completions.create(**kwargs)
                    msg = completion.choices[0].message
                    tool_calls_data = None
                    if msg.tool_calls and allow_tools:
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
                    logger.warning(f"[AgentOrchestrator] Groq call with model '{model_to_use}' failed: {e}")
                    continue

        # 2. Try Gemini API (Automatic failover when Groq reaches limits, rate-limits 429, or fails)
        if settings.GEMINI_API_KEY:
            try:
                logger.info("[AgentOrchestrator] Groq unavailable/rate-limited; executing failover to Gemini API...")
                gemini_url = f"{settings.GEMINI_BASE_URL.rstrip('/')}/chat/completions"
                headers = {
                    "Authorization": f"Bearer {settings.GEMINI_API_KEY}",
                    "Content-Type": "application/json"
                }

                # Adapt messages for Gemini if needed:
                # If any tool call is missing 'extra_content' (e.g. executed by Groq) OR if allow_tools is False
                # and there are tool outputs in messages, convert to clear context format to avoid Gemini 400 thought_signature error.
                needs_adaptation = False
                for m in messages:
                    if m.get("role") == "assistant" and m.get("tool_calls"):
                        for tc in m["tool_calls"]:
                            if "extra_content" not in tc:
                                needs_adaptation = True
                                break
                    elif m.get("role") == "tool" and not allow_tools:
                        needs_adaptation = True

                if needs_adaptation:
                    gemini_messages: List[Dict[str, Any]] = []
                    tool_data_chunks: List[str] = []
                    for m in messages:
                        if m.get("role") in ("system", "user"):
                            gemini_messages.append(m)
                        elif m.get("role") == "tool":
                            tool_data_chunks.append(f"[{m.get('name', 'tool')} output]: {m.get('content')}")

                    if tool_data_chunks:
                        gemini_messages.append({
                            "role": "user",
                            "content": (
                                "Verified Database & API Tool Results:\n"
                                + "\n".join(tool_data_chunks)
                                + "\n\nPlease synthesize the final comprehensive response based on these verified tool results, "
                                "strictly adhering to all domain guidelines, single-intent focus, and markdown formatting rules."
                            )
                        })
                else:
                    gemini_messages = messages

                gemini_candidates = [
                    settings.GEMINI_MODEL,
                    "gemini-flash-latest",
                    "gemini-3.5-flash",
                    "gemini-3.6-flash"
                ]
                seen_gemini_models = set()
                gemini_models_to_try = []
                for gm in gemini_candidates:
                    if gm and gm not in seen_gemini_models:
                        seen_gemini_models.add(gm)
                        gemini_models_to_try.append(gm)

                for g_model in gemini_models_to_try:
                    body: Dict[str, Any] = {
                        "model": g_model,
                        "messages": gemini_messages,
                        "temperature": 0.3,
                        "max_tokens": 800
                    }
                    if allow_tools and tools_list and not needs_adaptation:
                        body["tools"] = tools_list
                        body["tool_choice"] = "auto"

                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.post(gemini_url, headers=headers, json=body)
                        if resp.status_code == 200:
                            data = resp.json()
                            msg = data["choices"][0]["message"]
                            tool_calls_data = None
                            if msg.get("tool_calls") and allow_tools and not needs_adaptation:
                                tool_calls_data = []
                                for i, tc in enumerate(msg["tool_calls"]):
                                    call_item = {
                                        "id": tc.get("id", f"call_gemini_{i}"),
                                        "type": "function",
                                        "function": {
                                            "name": tc.get("function", {}).get("name"),
                                            "arguments": tc.get("function", {}).get("arguments")
                                        }
                                    }
                                    if "extra_content" in tc:
                                        call_item["extra_content"] = tc["extra_content"]
                                    tool_calls_data.append(call_item)

                            logger.info(f"[AgentOrchestrator] Gemini model '{g_model}' successfully served request as primary/fallback LLM.")
                            return {
                                "role": "assistant",
                                "content": msg.get("content") or None,
                                "tool_calls": tool_calls_data
                            }
                        else:
                            logger.warning(f"[AgentOrchestrator] Gemini model '{g_model}' returned status {resp.status_code}: {resp.text[:200]}")
                            continue
            except Exception as ge:
                logger.warning(f"[AgentOrchestrator] Gemini API fallback encountered error: {ge}")

        # 3. Try OpenRouter
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
                        "temperature": 0.2
                    }
                    if allow_tools and tools_list:
                        body["tools"] = tools_list

                    resp = await client.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=body)
                    if resp.status_code == 200:
                        data = resp.json()
                        msg = data["choices"][0]["message"]
                        return {
                            "role": "assistant",
                            "content": msg.get("content") or "",
                            "tool_calls": msg.get("tool_calls") if allow_tools else None
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
        Deterministic Rule-Based Engine.
        Executes verified tools directly and ensures 100% compliance with
        the 16 strict conversational behavior rules even without LLM access.
        """
        msg_lower = user_message.lower().strip()
        clean_greeting = msg_lower.strip("!.? \t\n")
        tool_results_log = []
        tools_used = []
        reply_lines = []

        # 1. Greetings (Rule 2: Never dump capabilities on greeting)
        if clean_greeting in ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "namaste", "greetings"]:
            reply_lines.append("Hello! How can I assist you with your education or career planning today?")

        # 2. Explicit Capability Inquiries (Rule 2: Only show capabilities when directly requested)
        elif any(phrase in msg_lower for phrase in ["what can you do", "what are your features", "what tools do you have", "how can you help me", "help me"]):
            reply_lines.append("### SkillCatalyst Career & Education Guidance\n")
            reply_lines.append("I can provide verified benchmarks and grounded data on:\n")
            reply_lines.append("1. **Education Costs & Tuition Breakdowns** (e.g. *'What is the cost of doing M.Tech in India?'*)")
            reply_lines.append("2. **Career Salaries & Industry Packages** (e.g. *'What is the expected salary of an AI Engineer?'*)")
            reply_lines.append("3. **Degree & Career Pathway Comparisons** (e.g. *'M.Tech vs immediate job after B.Tech'*)")
            reply_lines.append("4. **Education ROI & Payback Estimation** (e.g. *'Calculate ROI for an MBA'*)\n")
            reply_lines.append("What would you like to explore?")

        # 3. Education Cost & Fee Queries (Rule 1, Rule 6, Rule 11)
        elif any(w in msg_lower for w in ["cost", "fee", "fees", "tuition", "expense", "budget", "afford"]):
            deg = "mtech"
            if any(k in msg_lower for k in ["b.tech", "btech", "b.e", "bachelor"]):
                deg = "btech"
            elif any(k in msg_lower for k in ["mca", "computer applications"]):
                deg = "mca"
            elif any(k in msg_lower for k in ["mba", "business"]):
                deg = "mba"
            elif any(k in msg_lower for k in ["abroad", "foreign", "germany", "us", "usa"]):
                deg = "ms_abroad"
            elif any(k in msg_lower for k in ["inter", "intermediate", "11th", "12th", "+2"]):
                deg = "intermediate"
            elif any(k in msg_lower for k in ["master", "m.tech", "mtech", "ms"]):
                deg = "mtech"

            tools_used.append("getEducationCost")
            cost_data = execute_agent_tool("getEducationCost", {"degree_or_program": deg}, context, db)
            tool_results_log.append({"tool_name": "getEducationCost", "output": cost_data})

            deg_name = cost_data.get("degree_name", deg.upper())
            reply_lines.append(f"### Comprehensive Education Cost Breakdown: **{deg_name}**\n")

            govt = cost_data.get("government_institutes", {})
            if govt:
                total_govt = govt.get("total_2_year_cost") or govt.get("total_4_year_cost") or govt.get("total_estimated_cost")
                reply_lines.append(f"**1. Premier Government Institutes ({govt.get('institutes', 'IITs / NITs / State')})**:")
                reply_lines.append(f"- **Tuition**: {govt.get('tuition_per_year')}/year")
                reply_lines.append(f"- **Hostel & Living**: {govt.get('hostel_mess_per_year')}/year")
                reply_lines.append(f"- **Total Estimated Program Cost**: **{total_govt}**")
                if govt.get("stipend_offset"):
                    reply_lines.append(f"- **Stipend / Aid Offset**: {govt.get('stipend_offset')}")
                reply_lines.append("")

            pvt = cost_data.get("private_institutes", {})
            if pvt:
                total_pvt = pvt.get("total_2_year_cost") or pvt.get("total_4_year_cost") or pvt.get("total_estimated_cost")
                reply_lines.append(f"**2. Tier-1 Private Universities ({pvt.get('institutes', 'BITS / VIT / SRM')})**:")
                reply_lines.append(f"- **Tuition**: {pvt.get('tuition_per_year')}/year")
                reply_lines.append(f"- **Hostel & Living**: {pvt.get('hostel_mess_per_year')}/year")
                reply_lines.append(f"- **Total Estimated Program Cost**: **{total_pvt}**")
                if pvt.get("stipend_offset"):
                    reply_lines.append(f"- **Financial Assistance**: {pvt.get('stipend_offset')}")
                reply_lines.append("")

            extra = cost_data.get("additional_expenses", {})
            if extra:
                reply_lines.append("**3. Additional Estimated Out-of-Pocket Expenses**:")
                for k, v in extra.items():
                    label = k.replace("_", " ").title()
                    reply_lines.append(f"- **{label}**: {v}")
                reply_lines.append("")

            reply_lines.append(f"*Verified benchmark from {cost_data.get('data_source', 'Ministry of Education')} ({cost_data.get('verified_year', '2025-2026')}).*")
            reply_lines.append("\n**Next Step**: Would you like to estimate your payback period or calculate the 5-year ROI for this degree?")

        # 4. Salary & Compensation Queries (Rule 1, Rule 6, Rule 11)
        elif any(w in msg_lower for w in ["salary", "compensation", "package", "lpa", "earn", "ctc", "pay"]):
            career = "ai engineer"
            if any(k in msg_lower for k in ["software", "sde", "full stack", "web", "developer"]):
                career = "software engineer"
            elif any(k in msg_lower for k in ["data scientist", "data analyst", "analytics"]):
                career = "data scientist"
            elif any(k in msg_lower for k in ["cloud", "devops", "sre", "infrastructure"]):
                career = "cloud engineer"
            elif any(k in msg_lower for k in ["security", "cyber", "soc", "vapt"]):
                career = "cybersecurity analyst"
            elif any(k in msg_lower for k in ["ai", "machine learning", "ml"]):
                career = "ai engineer"

            tools_used.append("getSalaryEstimate")
            sal_data = execute_agent_tool("getSalaryEstimate", {"career_name": career}, context, db)
            tool_results_log.append({"tool_name": "getSalaryEstimate", "output": sal_data})

            ctitle = sal_data.get("career_title", career.title())
            exp = sal_data.get("experience_breakdown", {})
            reply_lines.append(f"### Expected Salary Benchmarks: **{ctitle}**\n")
            reply_lines.append("| Experience Level | Typical Range (INR) | Median Benchmark | Top Tier / Product MNCs |")
            reply_lines.append("| :--- | :--- | :--- | :--- |")

            e0 = exp.get("entry_level_0_2_yrs", {})
            e0_bk = e0.get("breakdown", {})
            t1_str = e0_bk.get("tier1_product_faang") or e0_bk.get("product_startups") or "₹16 – ₹30 LPA"
            reply_lines.append(f"| **Fresher (0–2 Yrs)** | {e0.get('range', '₹6 – ₹14 LPA')} | {e0.get('median', '₹10 LPA')} | {t1_str} |")

            e1 = exp.get("mid_level_2_5_yrs", {})
            reply_lines.append(f"| **Mid-Level (2–5 Yrs)** | {e1.get('range', '₹16 – ₹32 LPA')} | {e1.get('median', '₹22 LPA')} | High-growth FinTech / Unicorns |")

            e2 = exp.get("senior_lead_5_plus_yrs", {})
            reply_lines.append(f"| **Senior / Lead (5+ Yrs)** | {e2.get('range', '₹32 – ₹65+ LPA')} | {e2.get('median', '₹45 LPA')} | Principal Architect / Staff SDE |")

            reply_lines.append(f"\n- **Global / US Benchmark**: {sal_data.get('us_global_benchmark', '$100k–$160k/yr')}")
            if sal_data.get("key_skills_driving_top_pay"):
                reply_lines.append(f"- **Skills Driving Top Compensation**: {', '.join(sal_data['key_skills_driving_top_pay'][:3])}")
            if sal_data.get("top_hiring_sectors"):
                reply_lines.append(f"- **Top Hiring Sectors**: {', '.join(sal_data['top_hiring_sectors'][:3])}")

            reply_lines.append(f"\n*Source: {sal_data.get('data_source', 'Industry Benchmarks')} ({sal_data.get('verified_year', '2025-2026')}).*")
            reply_lines.append("\n**Next Step**: Would you like to know the critical skill gaps you need to close to target the top-tier salary band?")

        # 5. ROI & Payback Estimation Queries
        elif any(w in msg_lower for w in ["roi", "payback", "return on investment", "worth it"]):
            tools_used.append("calculateEducationROI")
            roi_data = execute_agent_tool("calculateEducationROI", {"degree_name": "Master's Degree (M.Tech)", "degree_cost": 450000, "expected_starting_salary": 1400000}, context, db)
            tool_results_log.append({"tool_name": "calculateEducationROI", "output": roi_data})

            reply_lines.append(f"### Financial Return on Investment (ROI) Analysis\n")
            reply_lines.append(f"- **Total Direct Education Investment**: {roi_data.get('total_education_investment')}")
            reply_lines.append(f"- **Expected Starting Salary**: {roi_data.get('expected_starting_salary')}")
            reply_lines.append(f"- **Estimated Payback Period**: **{roi_data.get('estimated_payback_period')}**")
            reply_lines.append(f"- **Projected 5-Year Net Gain**: {roi_data.get('five_year_net_gain')}")
            reply_lines.append(f"- **5-Year ROI**: **{roi_data.get('roi_percentage_5yr')}** ({roi_data.get('financial_verdict')})\n")
            reply_lines.append(f"{roi_data.get('financial_summary', '')}")
            reply_lines.append("\n**Next Step**: Would you like to compare this ROI against taking an immediate industry job?")

        # 6. Degree & Career Pathway Comparisons ("vs", "compare", "which is better")
        elif any(w in msg_lower for w in [" vs ", "versus", "compare", "which is better", "m.tech or job", "mtech or job", "mtech vs"]):
            p_a = "M.Tech in Computer Science"
            p_b = "Immediate Industry Job after B.Tech"
            if "mca" in msg_lower and "mtech" in msg_lower:
                p_a = "M.Tech in CSE"
                p_b = "MCA (Master of Computer Applications)"

            tools_used.append("compareCareerPathways")
            comp = execute_agent_tool("compareCareerPathways", {"pathway_a": p_a, "pathway_b": p_b}, context, db)
            tool_results_log.append({"tool_name": "compareCareerPathways", "output": comp})

            reply_lines.append(f"### Head-to-Head Comparison: **{comp.get('comparison_title')}**\n")
            pa_data = comp.get("pathway_a", {})
            pb_data = comp.get("pathway_b", {})

            reply_lines.append(f"**Pathway A: {pa_data.get('name')}**")
            reply_lines.append(f"- **Time / Cost**: {pa_data.get('duration_investment')} | {pa_data.get('financial_investment')}")
            reply_lines.append(f"- **Starting Compensation**: {pa_data.get('starting_compensation')}")
            if pa_data.get("primary_advantages"):
                reply_lines.append(f"- **Key Advantage**: {pa_data['primary_advantages'][0]}\n")

            reply_lines.append(f"**Pathway B: {pb_data.get('name')}**")
            reply_lines.append(f"- **Time / Cost**: {pb_data.get('duration_investment')} | {pb_data.get('financial_investment')}")
            reply_lines.append(f"- **Starting Compensation**: {pb_data.get('starting_compensation')}")
            if pb_data.get("primary_advantages"):
                reply_lines.append(f"- **Key Advantage**: {pb_data['primary_advantages'][0]}\n")

            recs = comp.get("recommendation_criteria", [])
            if recs:
                reply_lines.append("**Strategic Recommendation**:")
                for r in recs:
                    reply_lines.append(f"- {r}")
            reply_lines.append("\n**Next Step**: Would you like a detailed 5-year financial projection for either pathway?")

        # 7. Skill Gap Analysis
        elif any(w in msg_lower for w in ["skill", "gap", "missing", "become", "career", "role", "readiness"]):
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
                    reply_lines.append("\n**Next Step**: Would you like free video courses and project tutorials for the missing skills?")
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
                reply_lines.append("\n**Next Step**: Sign in to run an automated skill gap match against your profile.")

        # 8. Scholarships & Eligibility
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
                    reply_lines.append("**Next Step**: Would you like the list of required documents for applying to any of these?")
                else:
                    reply_lines.append("No scholarships matched your current profile criteria. Consider updating your income and academic records.")
            else:
                tools_used.append("searchScholarships")
                s_res = execute_agent_tool("searchScholarships", {"stage": context.stage or "b_tech", "limit": 4}, context, db)
                tool_results_log.append({"tool_name": "searchScholarships", "output": s_res})
                reply_lines.append("### Available Verified Scholarships\n")
                for s in s_res.get("scholarships", []):
                    reply_lines.append(f"- **{s['title']}** ({s['provider']}) — {s['amount']} | Deadline: {s['deadline']}")
                reply_lines.append("\n**Next Step**: Sign in to verify your exact eligibility status.")

        # 9. Jobs & Internships
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
            reply_lines.append("\n**Next Step**: Would you like to check what skills you are missing for these listings?")

        # 10. Official Guidelines & Documents
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

        # 11. Profile
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

        # 12. General fallback (Never dump capability menu!)
        else:
            reply_lines.append(
                "I am here to help you with education costs, expected career salaries, degree ROI, or skill gaps. "
                "Could you please specify which career, degree, or fee details you would like to explore?"
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
            tools_used=tools_used,
            user_query=user_message
        )

    async def _synthesize_fallback_text(self, query: str, tool_results: List[Dict[str, Any]]) -> str:
        """Synthesizes text from completed tool results if loop exits without explicit assistant text."""
        lines = []
        for tr in tool_results:
            tname = tr.get("tool_name")
            output = tr.get("output", {})

            if tname == "getEducationCost" and "degree_name" in output:
                govt = output.get("government_institutes", {})
                pvt = output.get("private_institutes", {})
                lines.append(f"### Education Cost Breakdown: **{output.get('degree_name')}**\n")
                if govt:
                    lines.append(f"- **Government Institutes ({govt.get('institutes', '')})**: {govt.get('total_2_year_cost') or govt.get('total_4_year_cost') or govt.get('total_estimated_cost')}")
                if pvt:
                    lines.append(f"- **Private Universities ({pvt.get('institutes', '')})**: {pvt.get('total_2_year_cost') or pvt.get('total_4_year_cost') or pvt.get('total_estimated_cost')}")
                lines.append(f"\n*Source: {output.get('data_source', 'Official Education Schedules')}*")

            elif tname == "getSalaryEstimate" and "career_title" in output:
                exp = output.get("experience_breakdown", {})
                lines.append(f"### Expected Salary Benchmarks: **{output.get('career_title')}**\n")
                lines.append(f"- **Fresher (0–2 Yrs)**: {exp.get('entry_level_0_2_yrs', {}).get('range', '₹6–₹14 LPA')}")
                lines.append(f"- **Mid-Level (2–5 Yrs)**: {exp.get('mid_level_2_5_yrs', {}).get('range', '₹16–₹32 LPA')}")
                lines.append(f"- **Senior / Lead (5+ Yrs)**: {exp.get('senior_lead_5_plus_yrs', {}).get('range', '₹32–₹65+ LPA')}")

            elif tname == "calculateEducationROI" and "financial_summary" in output:
                lines.append(f"### Education ROI Summary\n{output['financial_summary']}")

            elif tname == "compareCareerPathways" and "comparison_title" in output:
                lines.append(f"### Comparison: {output['comparison_title']}")
                lines.append(f"- **{output.get('pathway_a', {}).get('name')}**: Starting {output.get('pathway_a', {}).get('starting_compensation')}")
                lines.append(f"- **{output.get('pathway_b', {}).get('name')}**: Starting {output.get('pathway_b', {}).get('starting_compensation')}")

            elif tname == "calculateSkillGap" and "career_name" in output:
                lines.append(f"### Skill Gap for **{output['career_name']}**: {output.get('readiness_percentage')}% match.")

            elif tname == "findEligibleScholarships":
                lines.append(f"Found {output.get('eligible_scholarships_count', 0)} verified eligible scholarships.")

            elif tname == "searchJobs":
                lines.append(f"Found {len(output.get('jobs', []))} active job listings.")

        return "\n\n".join(lines) if lines else "Request processed through verified backend tools."


# Global singleton instance
agent_orchestrator = AgentOrchestrator()
