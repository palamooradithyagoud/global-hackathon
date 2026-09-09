# SkillCatalyst — Student Career & Education Intelligence Platform

> **Phase 1.1 — Student Onboarding & Intelligence Profile**  
> An AI-powered student career and education navigation platform mapping verified profiles to curated scholarships and institutional pathways.

---

## 🌟 Overview

SkillCatalyst creates a structured intelligence profile of who a student is—adapting dynamically whether they are in **Class 10**, **Intermediate (11th/12th)**, or **B.Tech / Higher Education**—and directly matches them to vetted institutional scholarships and career opportunities.

### Key Highlights
- **Dual Onboarding Pathways**:
  - **Option A (AI Resume Extraction)**: Upload a resume (PDF/TXT) with automated entity parsing (academic details, GPA, skills, projects, certifications).
  - **Option B (Dynamic Stage-Specific Forms)**: Tailored form fields for Class 10 (board, stream aspirations), Intermediate (streams, entrance exams), and B.Tech (department, CGPA, technical skills, GitHub/LinkedIn).
- **Personalized Scholarship Matching Engine**:
  - Stage-aware eligibility scoring based on academic percentage/CGPA, current education stage, annual family income thresholds, category, and state domicile.
  - Transparent match breakdown displaying green checkmarks for fulfilled criteria and red indicators for unmet requirements.
- **Modern Mobile & Desktop UX**:
  - Dark obsidian theme (`#0C0C10`) with glowing glassmorphism accents.
  - 4 pastel-tinted opportunity cards (**Scholarships**, **Job Pathways**, **Skill Tracks**, **New Pathways**).
  - Dedicated animated detail pages with smooth Framer Motion transitions.
  - Persistent floating capsule dock with instant navigation to **Home** (`⌂`) and **Profile Hub** (`⚯`).

---

## 🏗️ Architecture

```text
code/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, CORS, startup seed
│   │   ├── config.py         # App settings & environment config
│   │   ├── database.py       # SQLAlchemy engine & session maker
│   │   ├── models/           # Relational models (Student, AcademicProfile, etc.)
│   │   ├── schemas/          # Pydantic v2 schemas for request/response validation
│   │   ├── api/v1/           # API routes (/students, /scholarships)
│   │   └── services/         # Resume extraction & scholarship scoring engine
│   └── tests/                # Automated pytest test suite
│
└── frontend/                 # Next.js App Router (TypeScript + Tailwind v4)
    ├── src/
    │   ├── app/              # App Router pages (/login, /scholarships, /onboarding, /dashboard)
    │   ├── components/       # Reusable UI components (Navbar, BottomBar, OverviewCards, Forms)
    │   ├── lib/              # API client wrapper
    │   └── types/            # Shared TypeScript interfaces
    └── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Run Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Running Backend Tests
```bash
pytest backend/tests/ -v
```

---

## 📄 License
Developed for Global Hackathon — Phase 1.1 Implementation.
