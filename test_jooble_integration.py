import asyncio
import sys
from backend.app.core.database import SessionLocal
from backend.app.models.profile import Student
from backend.app.api.v1.endpoints.jobs import search_btech_pvt_jobs, BTechJobSearchRequest

def test_jooble_btech():
    print("==================================================")
    print("TEST: Jooble API Integration for B.Tech Private Sector")
    print("==================================================")
    
    db = SessionLocal()
    try:
        # Test 1: B.Tech student with profile skills (Arjun Sharma)
        req = BTechJobSearchRequest(student_id="demo-student-uuid-001", location="India", page=1)
        res = asyncio.run(search_btech_pvt_jobs(req, db))
        
        print(f"Location strictly enforced: {res.get('location')}")
        assert res.get("location") == "India", "Location must be strictly India"
        
        search_kw = res.get("search_keywords", "")
        print(f"Derived search keywords: {search_kw}")
        assert "Software" in search_kw or "Python" in search_kw, "Keywords should be derived from B.Tech student profile"
        
        jobs = res.get("jobs", [])
        print(f"Total jobs returned: {len(jobs)}")
        assert len(jobs) > 0, "Should return matched private sector jobs"
        
        first = jobs[0]
        print("\nFirst Job Details:")
        print(f"  Title: {first.get('title')}")
        print(f"  Company: {first.get('company')}")
        print(f"  Location: {first.get('location')}")
        print(f"  Match Score: {first.get('match_score')}%")
        print(f"  Matched Skills: {first.get('matched_skills')}")
        print(f"  Apply Link: {first.get('apply_link')}")
        print(f"  Verified Criteria: {first.get('verified_criteria')}")
        
        assert first.get("match_score") >= 80, "Match score should reflect profile alignment"
        assert len(first.get("verified_criteria", [])) >= 3, "Verified criteria breakdown should be present"
        assert "jooble.org" in first.get("apply_link", "") or "http" in first.get("apply_link", ""), "Apply link must be a valid URL"
        
        # Test 2: Custom keyword query
        req_custom = BTechJobSearchRequest(student_id="demo-student-uuid-001", keywords="Full Stack Developer", location="India", page=1)
        res_custom = asyncio.run(search_btech_pvt_jobs(req_custom, db))
        print(f"\nCustom keyword test ('Full Stack Developer'): {len(res_custom.get('jobs', []))} jobs returned")
        assert len(res_custom.get("jobs", [])) > 0, "Custom keyword query should return jobs"
        
        print("\nAll Jooble API tests passed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_jooble_btech()
