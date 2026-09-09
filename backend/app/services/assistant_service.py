import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import httpx
import groq

from backend.app.core.config import settings
from backend.app.models.profile import Student
from backend.app.models.assistant import AssistantMessage, AssistantMemory

logger = logging.getLogger(__name__)


# ============================================================================
# LLM Providers (OpenRouter primary, Groq fallback)
# ============================================================================

async def call_openrouter(
    messages: List[Dict[str, str]],
    api_key: str,
    model: str = "openrouter/free",
    base_url: str = "https://openrouter.ai/api/v1",
    timeout: float = 25.0,
) -> Optional[str]:
    """
    Queries OpenRouter chat completion endpoint with automatic fallback to openrouter/free.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Ascend AI Assistant",
    }
    target_model = model or "openrouter/free"
    payload = {
        "model": target_model,
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 600,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload,
            )

            # If chosen model is unavailable on current tier, fallback to openrouter/free
            if resp.status_code in (400, 402, 404) and target_model != "openrouter/free":
                logger.warning(
                    f"[OpenRouter] Model {target_model} returned HTTP {resp.status_code}. Retrying with openrouter/free."
                )
                payload["model"] = "openrouter/free"
                resp = await client.post(
                    f"{base_url.rstrip('/')}/chat/completions",
                    headers=headers,
                    json=payload,
                )

            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    if content and "<think>" in content:
                        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
                    if not content or content.strip().startswith("User Safety:") or len(content.strip()) < 5:
                        logger.warning(f"[OpenRouter] Non-conversational or classifier output received: {content[:50]}. Falling back.")
                        return None
                    logger.info(f"[OpenRouter] Query generated response via {data.get('model', target_model)}")
                    return content
            else:
                logger.warning(f"[OpenRouter] API returned status {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.error(f"[OpenRouter] Request exception: {e}")
    return None


async def call_groq(
    messages: List[Dict[str, str]],
    api_key: str,
    model: str = "llama-3.3-70b-versatile",
) -> Optional[str]:
    """
    Queries Groq chat completion endpoint.
    """
    try:
        client = groq.AsyncGroq(api_key=api_key)
        model_name = model or "llama-3.3-70b-versatile"
        if "qwen" in model_name:
            model_name = "llama-3.3-70b-versatile"

        completion = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.5,
            max_tokens=600,
        )
        logger.info(f"[Groq] Query generated response via {model_name}")
        return completion.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"[Groq] Request exception: {e}")
        return None


# ============================================================================
# Student Profile & Context Loading
# ============================================================================

def get_student_context(db: Session, student_id: str) -> Dict[str, Any]:
    """
    Extracts structured facts from the student's verified profile in DB.
    Strictly isolated per student_id.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {}

    acad = student.academic_profile
    fin = student.financial_context

    skills = [s.skill_name for s in (student.skills or []) if getattr(s, "skill_name", None)]
    projects = [p.name for p in (student.projects or []) if getattr(p, "name", None)]
    certs = [c.name for c in (student.certifications or []) if getattr(c, "name", None)]
    interests = [i.interest for i in (student.interests or []) if getattr(i, "interest", None)]

    return {
        "id": student.id,
        "name": student.name,
        "education_stage": student.education_stage,
        "target_role": student.target_role,
        "school_or_college": getattr(acad, "school_or_college", None),
        "board": getattr(acad, "board", None),
        "university": getattr(acad, "university", None),
        "branch": getattr(acad, "branch", None),
        "year": getattr(acad, "year", None),
        "stream": getattr(acad, "stream", None),
        "percentage": getattr(acad, "percentage", None),
        "cgpa": getattr(acad, "cgpa", None),
        "skills": skills,
        "projects": projects,
        "certifications": certs,
        "interests": interests,
        "education_budget": getattr(fin, "education_budget", None),
        "certification_budget": getattr(fin, "certification_budget", None),
    }


# ============================================================================
# Personal AI Memory (Study Goals, Language, Subjects, Career, Schedule)
# ============================================================================

def get_student_memory(db: Session, student_id: str) -> Dict[str, Any]:
    """
    Retrieves the private personal AI memory for a student.
    Strictly isolated per student_id / userId.
    """
    mem = db.query(AssistantMemory).filter(AssistantMemory.student_id == student_id).first()
    if not mem:
        return {
            "study_goals": None,
            "preferred_language": None,
            "strong_subjects": None,
            "weak_subjects": None,
            "career_interests": None,
            "study_schedule": None,
            "summary": None,
            "extracted_facts": {},
            "last_interaction": None,
        }

    facts = {}
    if mem.extracted_facts:
        try:
            facts = json.loads(mem.extracted_facts)
        except:
            facts = {}

    return {
        "study_goals": mem.study_goals or facts.get("study_goals"),
        "preferred_language": mem.preferred_language or facts.get("preferred_language"),
        "strong_subjects": mem.strong_subjects or facts.get("strong_subjects"),
        "weak_subjects": mem.weak_subjects or facts.get("weak_subjects"),
        "career_interests": mem.career_interests or facts.get("career_interests"),
        "study_schedule": mem.study_schedule or facts.get("study_schedule"),
        "summary": mem.summary,
        "extracted_facts": facts,
        "last_interaction": mem.last_interaction.isoformat() if mem.last_interaction else None,
    }


def update_student_memory(
    db: Session,
    student_id: str,
    updates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Updates specific memory fields for a student.
    Strictly isolated per student_id / userId.
    """
    mem = db.query(AssistantMemory).filter(AssistantMemory.student_id == student_id).first()
    if not mem:
        mem = AssistantMemory(
            student_id=student_id,
            last_interaction=datetime.now(timezone.utc)
        )
        db.add(mem)

    # Load existing facts
    facts = {}
    if mem.extracted_facts:
        try:
            facts = json.loads(mem.extracted_facts)
        except:
            facts = {}

    allowed_cols = [
        "study_goals",
        "preferred_language",
        "strong_subjects",
        "weak_subjects",
        "career_interests",
        "study_schedule",
        "summary",
    ]

    for key, val in updates.items():
        if val is not None:
            if key in allowed_cols:
                setattr(mem, key, str(val))
            facts[key] = val

    mem.extracted_facts = json.dumps(facts)
    mem.last_interaction = datetime.now(timezone.utc)
    db.commit()
    db.refresh(mem)

    return get_student_memory(db, student_id)


def clear_student_memory(db: Session, student_id: str) -> bool:
    """
    Resets the personal AI memory for a student.
    Strictly isolated per student_id / userId.
    """
    try:
        db.query(AssistantMemory).filter(AssistantMemory.student_id == student_id).delete()
        db.commit()
        return True
    except Exception as err:
        logger.error(f"[Ascend AI] Error clearing memory: {err}")
        db.rollback()
        return False


def extract_memory_from_query(user_query: str) -> Dict[str, str]:
    """
    Extracts core personal memory attributes from the user's message:
    - Study goals
    - Preferred programming language
    - Weak and strong subjects
    - Career interests
    - Study schedule
    """
    extracted = {}
    q = user_query.strip()
    q_lower = q.lower()

    def clean_clause(text: str) -> str:
        if not text:
            return ""
        # Split on sentence ends, commas, or conjunctions
        parts = re.split(r'[.,;\n]|(?:\s+(?:and|but|while|also|with)\s+)', text, flags=re.IGNORECASE)
        res = parts[0].strip()
        # Clean leading words like "in ", "at ", "a ", "an "
        res = re.sub(r'^(?:in|at|a|an|the)\s+', '', res, flags=re.IGNORECASE)
        return res.strip()

    # 1. Preferred Programming Language
    lang_match = re.search(
        r'(?:prefer|favorite|use|code in|love|proficient in|learning)\s+(python|java|c\+\+|cpp|javascript|typescript|golang|go|rust|c#|kotlin|swift|sql|ruby)',
        q_lower
    )
    if not lang_match:
        lang_match = re.search(r'(?:programming\s+)?language\s+(?:is|to use)\s+([a-zA-Z#+]+)', q_lower)
    if lang_match:
        val = lang_match.group(1).strip()
        if val.lower() in ["cpp", "c++"]:
            val = "C++"
        elif val.lower() in ["sql", "c#"]:
            val = val.upper()
        else:
            val = val.capitalize()
        extracted["preferred_language"] = val

    # 2. Study Goals
    goal_match = re.search(
        r'(?:my\s+goal\s+is\s+to|target\s+is\s+to|aiming\s+to|preparing\s+for|aiming\s+for|want\s+to\s+crack|plan\s+to)\s+([^.,;\n]+)',
        q,
        re.IGNORECASE
    )
    if goal_match:
        clean_goal = clean_clause(goal_match.group(1))
        if len(clean_goal) >= 3:
            extracted["study_goals"] = clean_goal

    # 3. Weak Subjects
    weak_match = re.search(
        r'(?:weak\s+(?:in|at)|struggling\s+with|difficult\s+for\s+me|find\s+([a-zA-Z\s]+)\s+hard|trouble\s+with)\s+([^.,;\n]+)',
        q,
        re.IGNORECASE
    )
    if weak_match:
        val = weak_match.group(2) or weak_match.group(1)
        clean_weak = clean_clause(val)
        if len(clean_weak) >= 2:
            extracted["weak_subjects"] = clean_weak

    # 4. Strong Subjects
    strong_match = re.search(
        r'(?:strong\s+(?:in|at)|good\s+at|confident\s+in|excel\s+at|mastered|my\s+strength\s+is)\s+([^.,;\n]+)',
        q,
        re.IGNORECASE
    )
    if strong_match:
        clean_strong = clean_clause(strong_match.group(1))
        if len(clean_strong) >= 2:
            extracted["strong_subjects"] = clean_strong

    # 5. Career Interests
    career_match = re.search(
        r'(?:want\s+to\s+become\s+(?:a|an)?|career\s+in|interested\s+in\s+(?:working\s+as\s+)?(?:a|an)?|target\s+role\s+is)\s+([^.,;\n]+)',
        q,
        re.IGNORECASE
    )
    if career_match:
        clean_career = clean_clause(career_match.group(1))
        if len(clean_career) >= 3:
            extracted["career_interests"] = clean_career

    # 6. Study Schedule
    sched_match = re.search(
        r'(?:study\s+schedule\s+is|can\s+study|daily\s+routine\s+is|study\s+for|routine\s+is)\s+([^.,;\n]+)',
        q,
        re.IGNORECASE
    )
    if sched_match:
        clean_sched = clean_clause(sched_match.group(1))
        if len(clean_sched) >= 3:
            extracted["study_schedule"] = clean_sched

    return extracted


# ============================================================================
# Response Formatting & Suggestions
# ============================================================================

def parse_response_and_suggestions(raw_text: str, stage: str) -> Tuple[str, List[str]]:
    """
    Separates the assistant's reply text from suggested follow-up chips.
    Looks for [SUGGESTIONS: ...] or generates stage-appropriate suggestions.
    """
    suggestions = []
    text = raw_text

    if "[SUGGESTIONS:" in text:
        parts = text.split("[SUGGESTIONS:")
        text = parts[0].strip()
        sug_part = parts[1].replace("]", "").strip()
        suggestions = [s.strip() for s in sug_part.split("|") if s.strip()]

    if not suggestions:
        if stage == "class_10":
            suggestions = [
                "Tell me about NMMS Scholarship",
                "Compare MPC vs BiPC streams",
                "How should I plan for 10th Boards?",
            ]
        elif stage == "intermediate":
            suggestions = [
                "Check INSPIRE Scholarship criteria",
                "Top entrance exams for engineering/medical",
                "Daily study routine for 12th Board + JEE",
            ]
        else:
            suggestions = [
                "Recommend highest fit tech skills",
                "How to apply for Reliance Tech Scholarship?",
                "Create a 60-day coding placement roadmap",
            ]

    return text, suggestions[:3]


def is_detailed_explanation_requested(user_query: str) -> bool:
    """
    Determines if user explicitly requested in-depth / detailed explanation.
    Rule: Short & direct by default; detailed only if explicitly requested.
    """
    q_lower = user_query.lower()
    triggers = [
        "explain in detail",
        "in detail",
        "teach me",
        "elaborate",
        "deep dive",
        "step by step in detail",
        "comprehensive breakdown",
        "explain thoroughly",
        "full breakdown",
        "detailed explanation",
    ]
    return any(t in q_lower for t in triggers)


def generate_fallback_reply(
    student_context: Dict[str, Any],
    personal_memory: Dict[str, Any],
    query: str,
    stage: str
) -> Tuple[str, List[str]]:
    """
    High-quality deterministic fallback adhering strictly to:
    - Short, clear, and direct by default.
    - Give only what was asked.
    - Bullet points when helpful.
    - Detailed only if explicitly asked.
    - Personalized with student memory (goals, preferred language, weak/strong subjects).
    """
    name = student_context.get("name") or "Student"
    q_lower = query.lower()
    wants_detail = is_detailed_explanation_requested(query)

    pref_lang = personal_memory.get("preferred_language") or "Python"
    study_goals = personal_memory.get("study_goals")
    weak_sub = personal_memory.get("weak_subjects")
    strong_sub = personal_memory.get("strong_subjects")
    career_interest = personal_memory.get("career_interests")
    study_sched = personal_memory.get("study_schedule")

    # 1. Scholarships
    if any(k in q_lower for k in ["scholarship", "money", "fund", "eligib", "grant"]):
        if stage == "class_10":
            reply = (
                f"Top scholarships for Class 10:\n\n"
                "• **NMMS**: Up to ₹12,000/yr (55%+ marks, family income < ₹3.5L).\n"
                "• **Pre-Matric State Scholarship**: Full tuition assistance for state residents."
            )
            sugs = ["How to apply for NMMS?", "Required documents", "Board exam tips"]
        elif stage == "intermediate":
            reply = (
                f"Top scholarships for Intermediate:\n\n"
                "• **INSPIRE (SHE)**: ₹80,000/yr for top 1% Class 10 board scorers pursuing science.\n"
                "• **Reliance Undergraduate**: Up to ₹2,00,000 across degree for merit-cum-means scholars."
            )
            sugs = ["INSPIRE criteria", "Reliance deadline", "Stream guidance"]
        else:
            cgpa = student_context.get("cgpa", 8.0)
            reply = (
                f"Top scholarships for B.Tech (CGPA: {cgpa}):\n\n"
                "• **Reliance Foundation Tech Scholarship**: Up to ₹2,00,000 for STEM students.\n"
                "• **AICTE Pragati & Saksham**: ₹50,000/yr for female / specially-abled engineers.\n"
                "• **Corporate CSR (TATA, Infosys)**: Merit grants for CGPA > 7.5."
            )
            sugs = ["View Scholarships Tab", "How to apply?", "Boost eligibility score"]
        return reply, sugs

    # 2. Coding / Skills
    elif any(k in q_lower for k in ["code", "skill", "tech", "fit", "job", "language", "program"]):
        tailored_goal = f" for your goal ({study_goals})" if study_goals else ""
        tailored_career = f" toward {career_interest}" if career_interest else ""

        if wants_detail:
            reply = (
                f"Detailed skill roadmap using **{pref_lang}**{tailored_goal}{tailored_career}:\n\n"
                f"1. **Core Language Mastery ({pref_lang})**: Master OOP, memory management, and built-in libraries.\n"
                "2. **Data Structures & Algorithms**: Solve 2 LeetCode problems daily (Arrays, HashMaps, Trees, DP).\n"
                "3. **Backend & Cloud**: Combine with FastAPI/PostgreSQL and containerize with Docker.\n"
                "4. **Production Portfolio**: Deploy 2 end-to-end full-stack systems with database indexing and auth."
            )
        else:
            reply = (
                f"Core tech skills to focus on in **{pref_lang}**{tailored_goal}:\n\n"
                f"• **Primary Language**: Master {pref_lang} data structures and async libraries.\n"
                "• **DSA Practice**: 2 LeetCode problems daily (HashMaps, Trees, Sliding Window).\n"
                "• **Backend + DB**: Build REST APIs with PostgreSQL and Docker."
            )
        return reply, ["DSA roadmap", "Recommended projects", "Add more skills"]

    # 3. Roadmap / Career
    elif any(k in q_lower for k in ["roadmap", "career", "become"]):
        target = career_interest or student_context.get("target_role") or "Software Engineer"
        if wants_detail:
            reply = (
                f"Detailed career roadmap to become a **{target}**:\n\n"
                f"• **Months 1-2 (Foundation)**: Solidify {pref_lang}, basic DSA, and Git version control.\n"
                "• **Months 3-4 (Frameworks & DB)**: Build REST APIs, study database schema design, and deploy to AWS/Render.\n"
                "• **Months 5-6 (Placement Prep)**: Complete 150 LeetCode questions, conduct mock technical interviews, and polish resume."
            )
        else:
            reply = (
                f"Key milestones to become a **{target}**:\n\n"
                f"• Master **{pref_lang}** and core computer science fundamentals.\n"
                "• Build & deploy **2 production projects** with clear GitHub READMEs.\n"
                "• Solve **150+ DSA problems** focusing on top interview patterns."
            )
        return reply, ["Study Planner tips", "Placement preparation", "Recommended projects"]

    # 4. Study Plan / Schedule
    elif any(k in q_lower for k in ["study", "plan", "schedule", "routine"]):
        sched = study_sched or "2 hours daily"
        weak_focus = f"• Spend the first 45 mins tackling **{weak_sub}**.\n" if weak_sub else ""
        strong_boost = f"• Dedicate 30 mins practicing **{strong_sub}** to maintain confidence.\n" if strong_sub else ""

        reply = (
            f"Daily study structure ({sched}):\n\n"
            f"{weak_focus}"
            "• 45 mins: Core concept mastery or coding practice.\n"
            f"{strong_boost}"
            "• 30 mins: Revision and active recall flashcards."
        )
        return reply, ["Exam prep tips", "Time management", "Ask another question"]

    # 5. Default
    else:
        memory_highlights = []
        if pref_lang:
            memory_highlights.append(f"Preferred Language: {pref_lang}")
        if study_goals:
            memory_highlights.append(f"Goal: {study_goals}")
        if weak_sub:
            memory_highlights.append(f"Focus Area: {weak_sub}")

        highlight_str = f" ({', '.join(memory_highlights)})" if memory_highlights else ""

        reply = (
            f"Hello {name}! I am Ascend AI{highlight_str}.\n\n"
            "How can I help you today? Ask me about scholarships, coding guidance, study plans, or career roadmaps."
        )
        return reply, ["Show my scholarships", "Recommended tech skills", "Daily study plan"]


# ============================================================================
# Main Reasoning Pipeline (Per-User Isolated)
# ============================================================================

async def ask_assistant(
    db: Session,
    user_query: str,
    student_id: Optional[str] = None,
    stage: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main Assistant Reasoning Pipeline:
    1. Loads student profile facts (isolated per student_id).
    2. Loads saved personal AI memory (goals, preferred language, weak/strong subjects, schedule).
    3. Loads recent private conversation history.
    4. Extracts any newly stated personal memory facts from user_query.
    5. Builds personalized system prompt enforcing Short, Clear & Direct response style.
    6. Queries OpenRouter API (falls back to Groq or deterministic engine).
    7. Persists conversation turn in AssistantMessage & updates AssistantMemory.
    8. Returns reply with follow-up suggestions and memory context.
    """
    # 1. Load Student Profile Context (per-user)
    student_context: Dict[str, Any] = {}
    if student_id:
        student_context = get_student_context(db, student_id)

    effective_stage = (
        student_context.get("education_stage")
        or stage
        or "b_tech"
    )

    # 2. Load Saved Personal AI Memory (per-user)
    student_memory: Dict[str, Any] = {}
    if student_id:
        student_memory = get_student_memory(db, student_id)

    # 3. Dynamically Extract New Personal Memory from Query
    if student_id:
        new_facts = extract_memory_from_query(user_query)
        if new_facts:
            logger.info(f"[Ascend AI] Discovered personal memory updates for {student_id}: {new_facts}")
            student_memory = update_student_memory(db, student_id, new_facts)

    # 4. Load Recent Private Conversation History (per-user)
    history_messages = []
    if student_id:
        past_msgs = (
            db.query(AssistantMessage)
            .filter(AssistantMessage.student_id == student_id)
            .order_by(AssistantMessage.created_at.desc())
            .limit(8)
            .all()
        )
        for pm in reversed(past_msgs):
            history_messages.append({"role": pm.role, "content": pm.content})

    # 5. Build Memory-Augmented System Prompt with Strict Style Constraints
    wants_detail = is_detailed_explanation_requested(user_query)

    style_rules = (
        "RESPONSE STYLE RULES (STRICT):\n"
        "1. DEFAULT STYLE: Be SHORT, CLEAR, and DIRECT. Answer ONLY what was asked in 2-4 sentences or tight bullet points.\n"
        "2. Do NOT include unnecessary preambles, chit-chat, or repeated profile echoes.\n"
        "3. Use concise bullet points when helpful.\n"
        "4. Provide detailed, in-depth explanations ONLY if explicitly requested by the user.\n"
        if not wants_detail else
        "RESPONSE STYLE RULES (DETAILED REQUESTED):\n"
        "1. The user explicitly requested detailed explanations. Provide a structured, thorough, step-by-step breakdown using markdown headings and bullet points.\n"
        "2. Tailor every point directly to their personal goals, preferred language, and academic stage.\n"
    )

    profile_facts = {
        "name": student_context.get("name"),
        "education_stage": student_context.get("education_stage") or effective_stage,
        "branch": student_context.get("branch"),
        "cgpa_or_marks": student_context.get("cgpa") or student_context.get("percentage"),
        "verified_skills": student_context.get("skills", []),
        "target_role": student_context.get("target_role"),
    }
    profile_facts = {k: v for k, v in profile_facts.items() if v}

    memory_facts = {
        "study_goals": student_memory.get("study_goals"),
        "preferred_programming_language": student_memory.get("preferred_language"),
        "strong_subjects": student_memory.get("strong_subjects"),
        "weak_subjects": student_memory.get("weak_subjects"),
        "career_interests": student_memory.get("career_interests"),
        "study_schedule": student_memory.get("study_schedule"),
    }
    memory_facts = {k: v for k, v in memory_facts.items() if v}

    system_prompt = (
        "You are Ascend AI, an intelligent personal student mentor and career companion for Indian students.\n\n"
        f"STUDENT PROFILE:\n{json.dumps(profile_facts, indent=2) if profile_facts else f'Stage: {effective_stage}'}\n\n"
        f"PERSONAL AI MEMORY (Saved for this user):\n{json.dumps(memory_facts, indent=2) if memory_facts else 'No memories recorded yet.'}\n\n"
        f"{style_rules}\n"
        "At the very end of your response, append 2-3 short follow-up prompt chips in this format:\n"
        "[SUGGESTIONS: prompt 1 | prompt 2 | prompt 3]"
    )

    llm_messages = [{"role": "system", "content": system_prompt}]
    llm_messages.extend(history_messages)
    llm_messages.append({"role": "user", "content": user_query})

    # 6. Reasoning Execution: OpenRouter -> Groq -> Deterministic Fallback
    has_openrouter = bool(settings.OPENROUTER_API_KEY and not settings.OPENROUTER_API_KEY.startswith("your_"))
    has_groq = bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your_"))
    ai_generated = False
    provider = "contextual_fallback"
    reply = ""
    suggestions: List[str] = []

    # Priority 1: OpenRouter API
    if has_openrouter:
        raw_reply = await call_openrouter(
            messages=llm_messages,
            api_key=settings.OPENROUTER_API_KEY,
            model=settings.OPENROUTER_MODEL,
            base_url=settings.OPENROUTER_BASE_URL,
        )
        if raw_reply:
            reply, suggestions = parse_response_and_suggestions(raw_reply, effective_stage)
            ai_generated = True
            provider = "openrouter"

    # Priority 2: Groq API
    if not ai_generated and has_groq:
        raw_reply = await call_groq(
            messages=llm_messages,
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
        )
        if raw_reply:
            reply, suggestions = parse_response_and_suggestions(raw_reply, effective_stage)
            ai_generated = True
            provider = "groq"

    # Priority 3: Fallback
    if not ai_generated:
        logger.info("[Ascend AI] Using contextual intelligence fallback.")
        reply, suggestions = generate_fallback_reply(
            student_context,
            student_memory,
            user_query,
            effective_stage
        )
        provider = "contextual_fallback"

    # 7. Persist Private Chat Turn & Memory in Database (Per-User Isolation)
    if student_id:
        try:
            user_record = AssistantMessage(
                student_id=student_id,
                role="user",
                content=user_query,
                suggestions=None
            )
            ai_record = AssistantMessage(
                student_id=student_id,
                role="assistant",
                content=reply,
                suggestions=json.dumps(suggestions)
            )
            db.add(user_record)
            db.add(ai_record)

            # Update memory summary & timestamp
            mem = db.query(AssistantMemory).filter(AssistantMemory.student_id == student_id).first()
            if mem:
                mem.last_interaction = datetime.now(timezone.utc)
                mem.summary = f"Recent question: {user_query[:50]}"
            else:
                mem = AssistantMemory(
                    student_id=student_id,
                    summary=f"Recent question: {user_query[:50]}",
                    last_interaction=datetime.now(timezone.utc)
                )
                db.add(mem)

            db.commit()
        except Exception as db_err:
            logger.error(f"[Ascend AI] Error saving message: {db_err}")
            db.rollback()

    return {
        "reply": reply,
        "suggestions": suggestions,
        "ai_generated": ai_generated,
        "provider": provider,
        "student_context_loaded": bool(student_context),
        "student_name": student_context.get("name"),
        "education_stage": effective_stage,
        "history_length": len(history_messages) + 2 if student_id else 2,
        "memory": student_memory if student_id else None,
    }


# ============================================================================
# Private History & Memory Retrieval Endpoints (User Isolation)
# ============================================================================

def get_conversation_history(db: Session, student_id: str) -> List[Dict[str, Any]]:
    """
    Returns private chat messages for the authenticated student.
    Strictly isolated per student_id / userId.
    """
    messages = (
        db.query(AssistantMessage)
        .filter(AssistantMessage.student_id == student_id)
        .order_by(AssistantMessage.created_at.asc())
        .limit(50)
        .all()
    )

    history = []
    for m in messages:
        sugs = []
        if m.suggestions:
            try:
                sugs = json.loads(m.suggestions)
            except:
                pass
        history.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "suggestions": sugs,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
    return history


def clear_conversation_history(db: Session, student_id: str) -> bool:
    """
    Clears private chat history for the authenticated student.
    Strictly isolated per student_id / userId.
    """
    try:
        db.query(AssistantMessage).filter(AssistantMessage.student_id == student_id).delete()
        db.commit()
        return True
    except Exception as err:
        logger.error(f"[Ascend AI] Error clearing history: {err}")
        db.rollback()
        return False
