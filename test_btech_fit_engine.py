import asyncio
from backend.app.core.database import SessionLocal
from backend.app.services.skill_taxonomy import normalize_skill
from backend.app.services.skill_extractor import extract_skills_from_text
from backend.app.services.skill_match_service import calculate_skill_gap
from backend.app.api.v1.endpoints.jobs import analyze_job_fit, AnalyzeJobRequest, search_jobs

def test_pipeline():
    print("==================================================")
    print("TEST: Skill Taxonomy, Deterministic Gap Engine & Groq")
    print("==================================================")

    # 1. Test Taxonomy Normalization
    print("\n--- 1. Testing Skill Taxonomy Normalization ---")
    aliases = [("React.js", "react"), ("React JS", "react"), ("NodeJS", "nodejs"), ("PostgreSQL", "postgresql"), ("FastAPI", "fastapi")]
    for raw, expected in aliases:
        norm = normalize_skill(raw)
        print(f"  {raw} -> {norm['normalized_name']} ({norm['category']})")
        assert norm["normalized_name"] == expected, f"Failed: {raw} expected {expected}, got {norm['normalized_name']}"
    print("Taxonomy normalization tests passed!")

    # 2. Test Deterministic Skill Gap Engine
    print("\n--- 2. Testing Deterministic Skill Gap Engine ---")
    student_skills = [
        {"skill_name": "SQL", "proficiency": "Intermediate"},    # level 3
        {"skill_name": "JavaScript", "proficiency": "Beginner"},  # level 1
        {"skill_name": "React", "proficiency": "Beginner"}        # level 1
    ]
    job_required_skills = [
        {"skill": "SQL", "required_proficiency": 3, "importance": "high"},
        {"skill": "JavaScript", "required_proficiency": 3, "importance": "high"},
        {"skill": "React", "required_proficiency": 4, "importance": "high"},
        {"skill": "Node.js", "required_proficiency": 3, "importance": "high"},
        {"skill": "Git", "required_proficiency": 3, "importance": "medium"}
    ]

    gap = calculate_skill_gap(student_skills, job_required_skills)
    print(f"  Status: {gap['status_label']} ({gap['status']})")
    print(f"  Matched Skills ({len(gap['matched_skills'])}): {[m['skill'] for m in gap['matched_skills']]}")
    partial_tuples = [(p['skill'], p['gap']) for p in gap['partial_skills']]
    print(f"  Partial Skills ({len(gap['partial_skills'])}): {partial_tuples}")
    print(f"  Missing Skills ({len(gap['missing_skills'])}): {[m['skill'] for m in gap['missing_skills']]}")

    print(f"  Priority Gaps ({len(gap['priority_gaps'])}): {[(pg['skill'], pg['priority']) for pg in gap['priority_gaps']]}")

    assert [m["skill"] for m in gap["matched_skills"]] == ["SQL"], "Only SQL should be fully matched"
    assert len(gap["partial_skills"]) == 2, "JavaScript and React should be partial"
    assert len(gap["missing_skills"]) == 2, "Node.js and Git should be missing"
    assert gap["status"] in ["needs_development", "major_skill_gaps"]
    print("Deterministic skill gap calculations verified!")

    # 3. Test Full Endpoint with Groq AI Reasoning
    print("\n--- 3. Testing Analyze Endpoint + Groq AI Reasoning ---")
    db = SessionLocal()
    try:
        # Search a job to get an ID
        jobs_res = asyncio.run(search_jobs(keyword="Software Engineer", location="India", db=db))
        assert len(jobs_res["jobs"]) > 0, "Should have retrieved or cached jobs"
        target_job = jobs_res["jobs"][0]
        job_id = target_job["id"]
        print(f"  Analyzing job: {target_job['title']} at {target_job['company']} (ID: {job_id})")

        analysis_res = asyncio.run(analyze_job_fit(
            job_id=job_id,
            payload=AnalyzeJobRequest(student_id="demo-student-uuid-001"),
            student_id=None,
            db=db
        ))

        assert analysis_res["has_skills"] is True, "Student should have skills"
        print(f"  Candidate: {analysis_res['student']['name']} ({', '.join(analysis_res['student']['skills'])})")
        print(f"  Deterministic Status: {analysis_res['analysis']['status_label']}")
        print(f"  AI Insight Generated: {analysis_res['ai_insight'].get('ai_generated')}")
        print(f"  AI Summary: {analysis_res['ai_insight']['summary']}")
        print(f"  AI Strengths: {analysis_res['ai_insight']['strengths']}")
        print(f"  AI Priority Gaps: {[(g['skill'], g['priority']) for g in analysis_res['ai_insight']['priority_gaps']]}")
        print(f"  AI Learning Plan: {[step['skill'] for step in analysis_res['ai_insight']['learning_plan']]}")
        print(f"  AI Project Recommendation: {analysis_res['ai_insight']['project_recommendation']}")

        has_gaps = len(analysis_res["analysis"]["missing_skills"]) > 0 or len(analysis_res["analysis"]["partial_skills"]) > 0
        if has_gaps:
            assert len(analysis_res["ai_insight"]["learning_plan"]) > 0, "Learning plan must contain actionable steps"
        assert len(analysis_res["ai_insight"]["project_recommendation"]) > 10, "Project recommendation must be provided"
        print("\nFull end-to-end B.Tech Job Fit & Groq AI Pipeline Verified Successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_pipeline()
