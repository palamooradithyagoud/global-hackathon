# 📋 SkillCatalyst — AI Agent Migration & Architecture Audit

**Document**: `docs/agent_migration_audit.md`  
**Date**: September 10, 2026  
**Author**: Senior AI Systems Architect & Production Engineering Lead  
**Scope**: Comprehensive forensic audit of existing implementation, data systems, dependencies, and architectural blueprint for migrating to **Agent + Tools + RAG + Database + Deterministic Matching + Memory + Verification**.

---

## 1. Executive Summary & Core Directives

SkillCatalyst / ASCEND currently operates with a dual-system nature:
1. **The Application Platform** (Onboarding, Stage-Isolated Scholarships, Jooble Live Jobs Feed, Skill Gap Evaluation, YouTube Video Lecture Sync) is robust, deterministic, and relational.
2. **The Chatbot Intelligence** (`backend/app/services/assistant_service.py`) operates as an isolated island—a **Level 3 Context-Augmented LLM Wrapper**. It extracts memory using static regular expressions and answers questions using generative parametric weights rather than querying the platform's deterministic databases and engines.

### The Objective
Replace the isolated prompt-and-generate chatbot with a **Production-Quality Agentic Copilot**:
```text
                    USER
                     ↓
                CHAT UI (AiAssistantModal)
                     ↓
                AGENT API (/api/v1/assistant/chat)
                     ↓
             ┌───────────────┐
             │     AGENT     │
             │ Orchestrator  │
             └───────┬───────┘
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
     TOOLS          RAG          MEMORY
       ↓             ↓             ↓
      DB          Documents    Preferences
       ↓             ↓
Deterministic     Evidence
  Engines
       │             │
       └─────────────┼─────────────┘
                     ↓
                VERIFICATION
                     ↓
                 LLM RESPONSE
                     ↓
                   USER
```

---

## 2. Current Chatbot Architecture Trace

### 2.1 Complete Request Lifecycle
1. **Frontend Initiation**: `frontend/src/components/common/AiAssistantModal.tsx` (`handleSend`) captures input from the UI or prompt chips, creates optimistic state, and calls `api.assistant.chat()`.
2. **Client Dispatch**: `frontend/src/lib/api.ts` makes an HTTP `POST` to `/api/v1/assistant/chat`.
3. **Route Controller**: `backend/app/api/v1/endpoints/assistant.py` receives `AssistantChatRequest` (`message`, `student_id`, `stage`).
4. **Service Orchestration**: `backend/app/services/assistant_service.py` (`ask_assistant`):
   - Synchronously queries `Student` and related tables (`academic_profile`, `student_skills`).
   - Synchronously queries `AssistantMemory` for the student ID.
   - Synchronously queries `AssistantMessage` for the last 8 turns.
   - Runs regex heuristics (`extract_memory_from_query`) on the raw user string to extract language, goals, weak/strong subjects, and updates the database.
   - Assembles a system prompt embedding profile facts and memory facts as raw JSON strings.
   - Calls **OpenRouter API** (`openrouter/free`). If unavailable (HTTP 400/402/404), retries once with `openrouter/free`.
   - If OpenRouter fails, calls **Groq API** (`llama-3.3-70b-versatile`).
   - If Groq fails or API keys are missing, executes `generate_fallback_reply()` (rule-based deterministic response).
   - Inserts two rows into `AssistantMessage` (user and assistant).
   - Formats response and extracts follow-up chips (`[SUGGESTIONS: ...]`).
5. **Frontend Rendering**: Appends message to chat bubble stream with Markdown formatting.

### 2.2 Forensic Flaws in Current Chatbot
* **No Tool Execution**: The LLM has zero ability to query the scholarship database, live Jooble jobs, or YouTube lectures.
* **Severe Hallucination Surface**: The LLM invents scholarship deadlines, eligibility criteria, and job salaries because it lacks grounding.
* **Brittle Regex Memory**: If a student says *"I used to like Java but now I am learning Rust"*, the regex parser matches Java first and overwrites the preference.
* **Authorization / IDOR Vulnerability**: Endpoints accept raw `student_id` without verifying session tokens or ownership.

---

## 3. Current Data Architecture & Models

### 3.1 Relational Schema (PostgreSQL / SQLite via SQLAlchemy)
* **`students`** ([`profile.py`](file:///c:/HACAKTHONS/GLOBAL%20HACKATHON/code/backend/app/models/profile.py)): Core user identity (`id`, `name`, `email`, `education_stage`, `target_role`).
* **`academic_profiles`**: Educational metrics (`school_or_college`, `board`, `university`, `branch`, `year`, `percentage`, `cgpa`, `stream`).
* **`student_skills`**: Normalized skills with proficiency (`skill_name`, `proficiency`).
* **`student_projects`**: Portfolio projects with GitHub URLs.
* **`scholarships`**: Seeded with ~25 real scholarships across Class 10, Intermediate, and B.Tech (`id`, `title`, `provider`, `current_study`, `min_cgpa_or_percentage`, `amount_inr`, `deadline`, `application_link`, `eligible_stages`).
* **`jobs`**: Cached Jooble private sector listings (`external_id`, `title`, `company`, `location`, `salary_raw`, `required_skills_json`).
* **`skill_tracks`**: User-saved roadmaps with synced YouTube Data API v3 playlists and lecture completion checkboxes.
* **`assistant_messages`**: Chat history (`student_id`, `role`, `content`, `suggestions`, `created_at`).
* **`assistant_memories`**: Consolidated student memory (`study_goals`, `preferred_language`, `strong_subjects`, `weak_subjects`, `career_interests`, `study_schedule`).

---

## 4. Reusability Analysis

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              REUSE (KEEP)                              │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Frontend UI: AiAssistantModal.tsx & BottomBar.tsx                   │
│ 2. Deterministic Scholarship Engine: scholarship_matcher.py            │
│ 3. Live Jooble Job Engine: jooble_service.py                           │
│ 4. Deterministic Skill Gap Engine: skill_match_service.py              │
│ 5. YouTube Playlist & Lecture Tracking: skill_tracks.py                │
│ 6. Multi-Provider Fallback Structure: OpenRouter + Groq + Offline      │
│ 7. Existing PostgreSQL / SQLite Database & ORM                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                REFACTOR                                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. assistant_service.py: Migrate from static prompt into Agent Core   │
│ 2. AssistantMemory: Migrate from regex slots to structured preference  │
│ 3. endpoints/assistant.py: Add authentication / authorization checks   │
│ 4. skill_taxonomy.py: Expand to 300-500 canonical database skills      │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              NEW TO BUILD                              │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Agent Orchestrator & Tool Registry (services/agent/)                │
│ 2. 10 Typed Deterministic & Live Tools                                 │
│ 3. Canonical Career & Career-Skill Tables (30-50 careers in PostgreSQL)│
│ 4. RAG Document Ingestion & Search Engine (60-100 verified docs)       │
│ 5. Verification Engine (verifyClaim against authoritative ground truth)│
│ 6. Agent Evaluation Dataset (50-100 scenarios in tests/agent_cases.json│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Detailed Breakdown of Missing Components

### 5.1 Typed Tool Registry (`services/agent/tool_registry.py`)
Must wrap the backend engines into OpenAI-compatible tool specifications with strict JSON Schemas, runtime validation, timeouts, and error handling:
1. `getStudentProfile(studentId)`
2. `searchCareers(query, category)`
3. `getCareerRequirements(careerId)`
4. `calculateSkillGap(studentId, careerId)`
5. `searchScholarships(stage, query, maxIncome, minCgpa)`
6. `checkScholarshipEligibility(scholarshipId, studentId)`
7. `findEligibleScholarships(studentId)`
8. `searchJobs(keyword, location, remote)`
9. `searchLearningResources(topic, skill)`
10. `searchKnowledgeBase(query, documentType)`
11. `verifyClaim(claim, sourceUrl)`

### 5.2 Canonical Skill Taxonomy & Career Models
- **Database Table `skills`**: Target 300–500 canonical skills (`skill_id`, `name`, `category`, `aliases`, `description`, `status`).
- **Database Table `careers`**: Target 30–50 high-value careers (`career_id`, `name`, `category`, `description`).
- **Database Table `career_skills`**: Relational junction (`career_id`, `skill_id`, `importance`, `target_level`).

### 5.3 Production-Grade RAG Pipeline
- **Corpus**: 60–100 authoritative documents:
  - Official National Scholarship Portal (NSP) guidelines.
  - UGC and AICTE regulations and scholarship brochures.
  - Telangana ePASS and State Post-Matric schemes.
  - Corporate scholarship notifications (Reliance, Siemens, Tata, LIC, SBI).
  - Standard national entrance exam rules (JEE, NEET, GATE, NDA, SSC).
- **Architecture**:
  - Text chunking (500–800 tokens with 100 token overlap).
  - Embeddings generation (fast local sentence-transformers or provider embeddings).
  - Storage: In-database vector storage or local vector index with rich metadata (`document_id`, `title`, `source`, `source_url`, `section`, `last_verified`).

### 5.4 Verification Engine (`verifyClaim`)
- When the agent produces facts regarding dates, eligibility, grant amounts, or rules, the claims must be verified against database records or RAG chunks.
- Unverifiable claims are flagged with `status: "unverified"` or `"uncertain"` rather than asserted as fact.

---

## 6. Proposed Final Agent Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND: AiAssistantModal.tsx                     │
│               (Passes user query & session authentication)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ POST /api/v1/assistant/chat
┌────────────────────────────────────▼────────────────────────────────────┐
│                    API CONTROLLER: endpoints/assistant.py               │
│          • Validates user identity and session token                    │
│          • Enforces per-user authorization & IDOR prevention            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                   AGENT ORCHESTRATOR: agent_orchestrator.py             │
│                                                                         │
│   Step 1: Session & Memory Preload                                      │
│           • Load authenticated student profile context                  │
│           • Load structured preference memory                           │
│           • Load recent conversation buffer                             │
│                                                                         │
│   Step 2: Routing & Intent Planning                                     │
│           • General Chit-chat / Basic Explanations → Direct LLM         │
│           • Student Facts / Scholarships / Jobs / Gaps → Tool Trigger   │
│                                                                         │
│   Step 3: Native Tool Calling Loop (Max Iterations: 3)                  │
│           ┌───────────────────────────────────────────────────────┐     │
│           │ Tool Registry Execution                               │     │
│           │ • getStudentProfile          • calculateSkillGap      │     │
│           │ • findEligibleScholarships   • searchJobs (Jooble)    │     │
│           │ • searchKnowledgeBase (RAG)  • searchLearningResources│     │
│           └───────────────────────────┬───────────────────────────┘     │
│                                       │ Return Tool Payloads            │
│   Step 4: Deterministic Grounding & Verification                        │
│           • Validate outputs against database and RAG evidence          │
│           • verifyClaim runs on amounts, dates, and eligibility scores  │
│                                                                         │
│   Step 5: Synthesize Response with Citations & Follow-up Chips          │
│           • LLM formats clear, concise explanation                      │
│           • Append source badges, official URLs, and suggestion chips   │
│                                                                         │
│   Step 6: Stateful Persistence                                          │
│           • Persist durable preferences to memory table                 │
│           • Save conversation turns to assistant_messages               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│               STREAM / JSON RESPONSE BACK TO FRONTEND                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Migration Plan (Zero-Downtime Phased Implementation)

```text
Phase 1: Foundation & Data Architecture
├── 1.1 Add SQLAlchemy models: Skill, Career, CareerSkill, VerificationRecord
├── 1.2 Seed Canonical Skills (300-500) and Careers (30-50) with relational mappings
└── 1.3 Normalize and expand Scholarship dataset (100+ verified entries)

Phase 2: RAG Pipeline Implementation
├── 2.1 Ingest 60-100 authoritative scholarship and academic guideline documents
├── 2.2 Implement chunking, metadata extraction, and vector indexing
└── 2.3 Implement searchKnowledgeBase tool with source citation

Phase 3: Tool Registry & Deterministic Engines
├── 3.1 Build tool_registry.py with typed Pydantic input/output schemas
├── 3.2 Implement student profile, career, skill-gap, scholarship, job, and lecture tools
└── 3.3 Implement verification engine (verifyClaim)

Phase 4: Agent Orchestrator & Chat Controller
├── 4.1 Build agent_orchestrator.py with native tool-calling loop (Groq/OpenRouter)
├── 4.2 Integrate structured memory update and retrieval
├── 4.3 Connect /api/v1/assistant/chat to the Agent Orchestrator
└── 4.4 Add security & IDOR authorization validation

Phase 5: Evaluation & Automated Testing
├── 5.1 Create tests/agent_cases.json with 50-100 comprehensive test scenarios
├── 5.2 Build unit tests for deterministic engines, tools, and verification
├── 5.3 Build integration tests for end-to-end agent conversations
└── 5.4 Validate frontend AiAssistantModal compatibility with zero visual regressions
```

---

## 8. Risk Assessment & Mitigation Strategies

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **External LLM Rate Limiting (Groq/OpenRouter)** | High | Medium | Implement intelligent tool caching, strict token limits (max 800), and maintain the existing deterministic rule-based fallback engine. |
| **Heavy Vector Dependencies Slowing Startup** | High | Low | Use an embedded, lightweight vector storage mechanism with pre-computed embeddings so backend boot time remains under 2 seconds. |
| **Infinite Agent Execution Loops** | High | Low | Enforce strict `max_iterations = 3` on the orchestrator tool loop; fallback immediately to synthesis if limit is reached. |
| **Breaking Existing Frontend UI** | High | Low | Preserve the exact response contract expected by `AiAssistantModal.tsx` (`{ reply: string, suggestions: string[], memory: ... }`). |
| **Data Inconsistency in Skill Gap Calculation** | Medium | Low | Canonical skill taxonomy normalizes synonyms (e.g., "Python3" → "Python") before any relational matching occurs. |

---

## 9. Next Immediate Steps
1. Submit implementation plan for user review.
2. Upon user approval, execute Phase 1 (Database models & taxonomy seeding) without touching frontend code.
3. Proceed iteratively through Phases 2 to 5 with automated test verification at every stage.
