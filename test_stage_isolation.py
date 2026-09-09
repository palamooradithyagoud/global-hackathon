import urllib.request
import json

base_url = "http://127.0.0.1:8000/api/v1"

def test_stage(stage_name):
    req = urllib.request.Request(
        f"{base_url}/auth/demo",
        data=json.dumps({"role": "demo_student", "education_stage": stage_name}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        user = json.loads(resp.read().decode())
    
    student_id = user["student_id"]
    print(f"\n--- Testing Stage: {stage_name} ---")
    print(f"Student: {user['name']} ({user['email']}), ID: {student_id}")

    with urllib.request.urlopen(f"{base_url}/scholarships/personalized?student_id={student_id}") as resp:
        scholarships = json.loads(resp.read().decode())

    print(f"Total Personalized Scholarships: {len(scholarships)}")
    for idx, s in enumerate(scholarships, 1):
        print(f"  {idx}. {s['title']} | Stages: {s['eligible_stages']} | Score: {s['match_score']}% | Eligible: {s['is_eligible']}")

for stg in ["class_10", "intermediate", "b_tech"]:
    test_stage(stg)
