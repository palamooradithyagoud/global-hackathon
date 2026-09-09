# SkillCatalyst Grounded AI Agent Architecture

This document specifies the technical architecture, security boundaries, deterministic engines, data models, tool protocols, and evaluation mechanisms implemented for **SkillCatalyst / ASCEND**.

---

## 1. System Overview

SkillCatalyst has transitioned from a Level-3 prompt-engineered chatbot to an **Evidence-Grounded AI Agent System**:

```text
User
 ↓
Chat UI (AiAssistantModal.tsx)
 ↓
Authenticated Agent API (/api/v1/assistant/chat)
 ↓
Agent Context Layer (IDOR Boundary)
 ↓
Agent Orchestrator (Multi-turn Bounded Loop, MAX_ITERATIONS = 3)
 ├── Native LLM Tool Calling (Llama-3.3-70B via Groq / OpenRouter)
 └── Deterministic Intent Router (Fallback if LLM Unavailable)
 ↓
Typed Tool Registry
 ├── getStudentProfile (Authenticated Student DB)
 ├── searchCareers (Canonical Career Taxonomy DB)
 ├── getCareerRequirements (Relational Career-Skills DB)
 ├── calculateSkillGap (Deterministic Gap Analysis Engine)
 ├── searchScholarships (Verified Scholarship DB)
 ├── checkScholarshipEligibility (Deterministic Eligibility Rules)
 ├── findEligibleScholarships (Multi-Criteria Filter Engine)
 ├── searchJobs (Live Jooble API + Database Cache)
 ├── searchLearningResources (Curated & YouTube Playlists)
 ├── searchKnowledgeBase (Authoritative RAG Vector Store)
 ├── verifyClaim (Factual Trust & Evidence Engine)
 └── updateStudentMemory (Durable Preference Store)
 ↓
Evidence Verification & Provenance Layer
 ↓
Response Synthesis & Citation Formatter
 ↓
Backward-Compatible JSON Response
```

---

## 2. Core Architectural Principles

1. **LLM != Source of Truth**: The LLM acts purely as the orchestrator for reasoning, intent parsing, planning, tool selection, and explaining deterministic results. The LLM never calculates skill gaps, never invents scholarships or deadlines, and never decides authorization.
2. **Server-Controlled Identity (IDOR-Proof)**: The client can never supply an arbitrary `student_id` to access or modify another student's data. Protected tools only accept `AgentContext` populated by the server.
3. **Deterministic Calculations**:
   - Skill gaps are computed mathematically comparing student skills against canonical `CareerSkill` records.
   - Scholarship eligibility is evaluated using deterministic rules (stage, CGPA, income, state domicile, gender).
4. **Authoritative RAG (No Hallucinations)**: Unstructured government and institutional guidelines (NSP, ePASS, AICTE, UGC, GATE, EAMCET) are indexed with complete provenance (`document_id`, `source`, `source_url`, `section`, `page`, `last_verified`).
5. **Durable vs Ephemeral Memory**:
   - Profile facts -> `students`, `academic_profiles`, `student_skills`
   - Preferences & goals -> `durable_memory` (user-scoped, supports correction)
   - Conversation history -> `assistant_messages`

---

## 3. Database Schema & Models

### `skills` Table
- `id`: UUID primary key
- `name`: Unique canonical name (e.g. "Python", "React", "Docker")
- `category`: Domain taxonomy (Programming, Frontend, Backend, Database, DevOps, AI/ML, Cloud)
- `aliases`: JSON array of synonyms (e.g. `["python3", "python 3", "py"]`)
- `status`: `active` or `deprecated`

### `careers` Table
- `id`: UUID primary key (e.g. `C001` - `C035`)
- `name`: Career title (e.g. "Machine Learning Engineer", "Cloud Solutions Architect")
- `category`: High-level domain
- `description`: Industry scope and responsibilities

### `career_skills` Junction Table
- `career_id`: FK to `careers.id`
- `skill_id`: FK to `skills.id`
- `importance`: Float (0.1 to 1.0)
- `target_level`: Required proficiency ("Beginner", "Intermediate", "Advanced")

### `durable_memory` Table
- `student_id`: FK to `students.id` (strictly scoped)
- `type`: `preference`, `goal`, `constraint`
- `key`: Unique preference key per student (e.g. `preferred_learning_style`, `course_budget`)
- `value`: Preference value (supports update/correction)
- `confidence`: Confidence score (0.0 to 1.0)

### `verification_records` Table
- `claim`: Factual statement verified
- `source`: Authoritative provider or publication
- `evidence`: Exact quoted or matched chunk
- `source_url`: Official URL
- `status`: `verified`, `unverified`, `uncertain`, `conflicting`, `expired`

### `agent_traces` Table
- Observability and latency tracing logging request ID, query, selected tools, results, latency, and status without exposing sensitive credentials.

---

## 4. Deterministic Engines

### Skill-Gap Engine (`skill_match_service.py`)
```text
Student Skills → Canonical Normalization (320+ taxonomy)
      ↓
Career Required Skills (from career_skills table)
      ↓
Level Comparison (Beginner: 1, Basic: 2, Intermediate: 3, Advanced: 4, Expert: 5)
      ↓
Matched / Partial / Missing / Priority Gaps Categorization
      ↓
Readiness Score % + Status ('aligned', 'needs_development', 'major_skill_gaps')
```

### Scholarship Eligibility Engine (`scholarship_matcher.py`)
Evaluates:
1. **Education Stage**: Matches `class_10`, `intermediate`, or `b_tech`.
2. **Current Study Year**: Year 1–4 matching for engineering scholarships.
3. **Academic Score**: Evaluates student CGPA / percentage against minimum thresholds.
4. **Income Ceiling**: Checks family annual income against `max_income`.
5. **State Domicile**: Verifies residency for state-specific grants (e.g. Telangana ePASS).
6. **Gender Requirements**: Validates female-specific grants (e.g. AICTE Pragati, CBSE Single Girl Child).
7. **Status**: Rejects expired cycles.

---

## 5. Security & Prompt Injection Defense

1. **Untrusted Data Boundary**: Tool outputs, retrieved RAG documents, and user inputs are strictly encapsulated as data payloads. A prompt injection phrase like `"Ignore previous instructions"` embedded inside a scholarship brochure or user message is never promoted to system instruction level.
2. **Permission Gate (`tool_permissions.py`)**:
   - `require_student_auth`: `getStudentProfile`, `calculateSkillGap`, `checkScholarshipEligibility`, `findEligibleScholarships`, `updateStudentMemory`.
   - `read_public`: `searchCareers`, `getCareerRequirements`, `searchScholarships`, `searchJobs`, `searchLearningResources`, `searchKnowledgeBase`, `verifyClaim`.
3. **Credential Redaction**: Internal environment variables, SQL passwords, and user PII are never returned in traces or synthesized responses.
