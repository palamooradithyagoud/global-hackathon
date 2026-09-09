from sqlalchemy.orm import Session
from backend.app.models.profile import (
    Scholarship, Student, AcademicProfile, StudentSkill, StudentProject,
    StudentCertification, StudentExperience, StudentInterest, StudentPreference, StudentFinancialContext
)

SEED_SCHOLARSHIPS = [
    {
        "id": "reliance-foundation-ug-2025",
        "title": "Reliance Foundation Undergraduate Scholarship",
        "provider": "Reliance Foundation",
        "description": "Prestigious national scholarship supporting meritorious undergraduate students in India across STEM, Humanities, and Commerce with mentorship and leadership development.",
        "benefit_value": "₹2,00,000 grant over degree",
        "deadline": "October 15, 2025",
        "eligible_stages": "b_tech,intermediate",
        "min_cgpa_or_percentage": 7.5,
        "eligible_streams_or_branches": "Computer Science,Electronics,Mechanical,Civil,Chemical,Information Technology,Data Science",
        "tags": "Merit-cum-Means,Undergraduate,STEM"
    },
    {
        "id": "google-generation-apac-2025",
        "title": "Generation Google Scholarship (APAC)",
        "provider": "Google India & APAC",
        "description": "Awarded to aspiring computer science students who demonstrate passion for technology, academic excellence, and leadership in fostering diversity and inclusion.",
        "benefit_value": "$2,500 USD grant + Community",
        "deadline": "November 30, 2025",
        "eligible_stages": "b_tech",
        "min_cgpa_or_percentage": 8.0,
        "eligible_streams_or_branches": "Computer Science,Information Technology,Artificial Intelligence,Software Engineering",
        "tags": "Women in Tech,Computer Science,Global"
    },
    {
        "id": "aicte-pragati-girls-2025",
        "title": "AICTE Pragati Scholarship for Girls",
        "provider": "Ministry of Education (Govt. of India)",
        "description": "Government scholarship scheme aimed at providing assistance for advancement of girl students pursuing technical degree or diploma education in recognized institutions.",
        "benefit_value": "₹50,000 per year towards tuition",
        "deadline": "December 31, 2025",
        "eligible_stages": "b_tech,intermediate",
        "min_cgpa_or_percentage": 6.5,
        "eligible_streams_or_branches": "All Technical Streams,Engineering,Technology",
        "tags": "Government,Girls Education,Technical"
    },
    {
        "id": "tata-capital-pankh-2025",
        "title": "Tata Capital Pankh Scholarship Programme",
        "provider": "Tata Capital CSR Foundation",
        "description": "Financial empowerment initiative providing tuition fees reimbursement and academic support for school and college students from economically vulnerable families.",
        "benefit_value": "Up to 80% tuition fee support",
        "deadline": "November 10, 2025",
        "eligible_stages": "class_10,intermediate,b_tech",
        "min_cgpa_or_percentage": 60.0,
        "eligible_streams_or_branches": None,
        "tags": "Need-Based,Class 10-12,Tuition Support"
    },
    {
        "id": "aditya-birla-capital-2025",
        "title": "Aditya Birla Capital COVID Support & Merit Grant",
        "provider": "Aditya Birla Capital Foundation",
        "description": "Comprehensive scholarship covering educational expenses and coaching stipends for promising secondary and senior secondary students.",
        "benefit_value": "₹18,000 - ₹30,000 annual grant",
        "deadline": "October 28, 2025",
        "eligible_stages": "class_10,intermediate",
        "min_cgpa_or_percentage": 65.0,
        "eligible_streams_or_branches": "MPC,BiPC,MEC,Science,Commerce",
        "tags": "Secondary,Higher Secondary,Coaching Grant"
    },
    {
        "id": "ntse-national-talent-2025",
        "title": "National Talent Search Scholarship (NTSE)",
        "provider": "NCERT (Govt. of India)",
        "description": "Premier national talent search program recognizing intellectual aptitude in Class 10 students with continuous monthly stipends through Ph.D. level.",
        "benefit_value": "₹1,250/month (Higher Sec) to ₹2,000/month (UG/PG)",
        "deadline": "November 20, 2025",
        "eligible_stages": "class_10",
        "min_cgpa_or_percentage": 70.0,
        "eligible_streams_or_branches": None,
        "tags": "National Honor,Class 10,Stipend"
    },
    {
        "id": "dr-abdul-kalam-stem-2025",
        "title": "Dr. APJ Abdul Kalam STEM Talent Award",
        "provider": "Foundation for Innovation & Science",
        "description": "Encouraging early research instincts and engineering enthusiasm among young students with sponsored lab equipment and project stipends.",
        "benefit_value": "₹45,000 research grant + Mentor access",
        "deadline": "January 15, 2026",
        "eligible_stages": "intermediate,b_tech",
        "min_cgpa_or_percentage": 7.8,
        "eligible_streams_or_branches": "MPC,Computer Science,Electronics,Physics",
        "tags": "STEM Research,Innovation,Mentorship"
    }
]


def seed_database(db: Session):
    """Populates initial scholarships and demo profile data if not present."""
    # Seed scholarships
    for item in SEED_SCHOLARSHIPS:
        existing = db.query(Scholarship).filter(Scholarship.id == item["id"]).first()
        if not existing:
            scholarship = Scholarship(
                id=item["id"],
                title=item["title"],
                provider=item["provider"],
                description=item["description"],
                benefit_value=item["benefit_value"],
                deadline=item["deadline"],
                eligible_stages=item["eligible_stages"],
                min_cgpa_or_percentage=item["min_cgpa_or_percentage"],
                eligible_streams_or_branches=item["eligible_streams_or_branches"],
                tags=item["tags"]
            )
            db.add(scholarship)

    # Seed a standard demo student profile (Arjun Sharma - B.Tech CSE)
    demo_email = "demo.student@skillcatalyst.dev"
    demo_student = db.query(Student).filter(Student.email == demo_email).first()
    if not demo_student:
        demo_student = Student(
            id="demo-student-uuid-001",
            name="Arjun Sharma",
            email=demo_email,
            date_of_birth="2003-08-14",
            location="Hyderabad, Telangana",
            education_stage="b_tech",
            target_role="Software Engineer"
        )
        db.add(demo_student)
        db.flush()

        academic = AcademicProfile(
            student_id=demo_student.id,
            school_or_college="Hyderabad Institute of Technology & Management",
            board=None,
            university="JNTU Hyderabad",
            branch="Computer Science and Engineering",
            year="3rd Year",
            percentage=None,
            cgpa=8.42,
            stream=None,
            future_direction=None
        )
        db.add(academic)

        skills = [
            ("Python", "Advanced"),
            ("React", "Intermediate"),
            ("SQL", "Intermediate"),
            ("FastAPI", "Intermediate"),
            ("Git & GitHub", "Advanced"),
            ("Data Structures", "Intermediate")
        ]
        for name, prof in skills:
            db.add(StudentSkill(student_id=demo_student.id, skill_name=name, proficiency=prof))

        projects = [
            StudentProject(
                student_id=demo_student.id,
                name="SkillCatalyst Opportunity Navigator",
                description="AI-guided pathway navigator mapping verified student credentials to curated institutional scholarships.",
                technologies="Python, Next.js, PostgreSQL, Tailwind CSS",
                github_url="https://github.com/arjunsharma/skillcatalyst"
            ),
            StudentProject(
                student_id=demo_student.id,
                name="Automated Lab Telemetry Collector",
                description="IoT-integrated telemetry parser for automated sensor data acquisition and anomaly alerting.",
                technologies="Python, SQLite, MQTT, React",
                github_url="https://github.com/arjunsharma/lab-telemetry"
            )
        ]
        for p in projects:
            db.add(p)

        db.add(StudentCertification(
            student_id=demo_student.id,
            name="AWS Certified Cloud Practitioner",
            issuer="Amazon Web Services",
            date="2024",
            credential_url="https://aws.amazon.com/verification"
        ))

        db.add(StudentExperience(
            student_id=demo_student.id,
            type="internship",
            organization="Cognizant Digital Works",
            role="Software Engineering Intern",
            description="Contributed to RESTful microservices for internal talent allocation dashboard.",
            start_date="May 2024",
            end_date="July 2024"
        ))

        db.add(StudentPreference(
            student_id=demo_student.id,
            preferred_location="Hyderabad / Bangalore",
            available_learning_time="2–4 hours/day"
        ))

        db.add(StudentFinancialContext(
            student_id=demo_student.id,
            education_budget="₹1,50,000 - ₹2,50,000 / year",
            certification_budget="₹15,000"
        ))

    db.commit()
