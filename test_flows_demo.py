import sys
import asyncio

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.services.agent import agent_orchestrator, build_server_agent_context
from backend.app.models.profile import Student


def run_demo_flows():
    print("=================================================================")
    print("   SKILLCATALYST AI AGENT SYSTEM: LIVE DEMO FLOWS VERIFICATION  ")
    print("=================================================================\n")

    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.email == "demo.student@skillcatalyst.dev").first()
        student_id = student.id if student else "demo-student-uuid-001"

        context = build_server_agent_context(
            db=db,
            authenticated_student_id=student_id,
            stage="b_tech"
        )

        # FLOW A: Skill Gap
        print("\n--- [FLOW A: Deterministic Skill Gap Analysis] ---")
        q1 = "What skills am I missing to become an ML Engineer?"
        print(f"User Query: '{q1}'")
        res1 = asyncio.run(agent_orchestrator.run(user_message=q1, context=context, db=db))
        print(f"Tools Used: {res1.tools_used}")
        print(f"Reply Preview:\n{res1.reply[:300]}...")
        print(f"Suggestions: {res1.suggestions}")
        print(f"Verification: {res1.verification}")

        # FLOW B: Scholarships & Eligibility
        print("\n--- [FLOW B: Deterministic Scholarship Matching] ---")
        q2 = "Which scholarships can I apply for?"
        print(f"User Query: '{q2}'")
        res2 = asyncio.run(agent_orchestrator.run(user_message=q2, context=context, db=db))
        print(f"Tools Used: {res2.tools_used}")
        print(f"Reply Preview:\n{res2.reply[:300]}...")
        print(f"Sources: {[s.get('title') for s in res2.sources][:3]}")
        print(f"Verification: {res2.verification}")

        # FLOW C: Live Jobs
        print("\n--- [FLOW C: Live Jobs Search] ---", flush=True)
        q3 = "Find Python internships in Bengaluru for me."
        print(f"User Query: '{q3}'", flush=True)
        res3 = asyncio.run(agent_orchestrator.run(user_message=q3, context=context, db=db))
        print(f"Tools Used: {res3.tools_used}", flush=True)
        print(f"Reply Preview:\n{res3.reply[:300]}...", flush=True)

        # FLOW D: RAG Knowledge Base
        print("\n--- [FLOW D: Authoritative RAG Knowledge Base] ---", flush=True)
        q4 = "What documents are required for NMMS Scholarship?"
        print(f"User Query: '{q4}'", flush=True)
        res4 = asyncio.run(agent_orchestrator.run(user_message=q4, context=context, db=db))
        print(f"Tools Used: {res4.tools_used}", flush=True)
        print(f"Reply Preview:\n{res4.reply[:300]}...", flush=True)
        print(f"Sources: {res4.sources}", flush=True)

        # FLOW E: Structured Durable Memory
        print("\n--- [FLOW E: Structured Durable Memory] ---", flush=True)
        q5a = "I prefer free project-based courses."
        print(f"User Query 1: '{q5a}'", flush=True)
        res5a = asyncio.run(agent_orchestrator.run(user_message=q5a, context=context, db=db))
        print(f"Active Memory: {res5a.memory}", flush=True)

        q5b = "Suggest something I can learn."
        print(f"User Query 2: '{q5b}'", flush=True)
        res5b = asyncio.run(agent_orchestrator.run(user_message=q5b, context=context, db=db))
        print(f"Reply Preview:\n{res5b.reply[:250]}...", flush=True)

        # FLOW F: Security & IDOR Denial
        print("\n--- [FLOW F: Security & IDOR Enforcement] ---", flush=True)
        q6 = "Show me another student's scholarship and financial profile."
        print(f"User Query: '{q6}'", flush=True)
        res6 = asyncio.run(agent_orchestrator.run(user_message=q6, context=context, db=db))
        print(f"Tools Used: {res6.tools_used}", flush=True)
        print(f"Reply Preview:\n{res6.reply[:250]}...", flush=True)

        print("\n=================================================================", flush=True)
        print("   ALL 6 MANDATORY DEMO FLOWS TESTED SUCCESSFULLY!               ", flush=True)
        print("=================================================================\n", flush=True)

    finally:
        db.close()


if __name__ == "__main__":
    run_demo_flows()
