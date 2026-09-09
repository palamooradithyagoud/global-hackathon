from sqlalchemy.orm import Session
from backend.app.models.profile import (
    Scholarship, Student, AcademicProfile, StudentSkill, StudentProject,
    StudentCertification, StudentExperience, StudentInterest, StudentPreference, StudentFinancialContext
)

SEED_SCHOLARSHIPS = [
    # ==========================================
    # 1. CLASS 10 EXCLUSIVE SCHOLARSHIPS
    # ==========================================
    {
        "id": "ntse-national-talent-2025",
        "title": "National Talent Search Examination (NTSE) Scholarship",
        "provider": "NCERT (Govt. of India)",
        "description": "Premier national talent search honoring top Class 10 students across India with continuous monthly stipends from secondary through higher education.",
        "benefit_value": "₹1,250 - ₹2,000 / month continuous stipend",
        "deadline": "November 20, 2025",
        "eligible_stages": "class_10",
        "min_cgpa_or_percentage": 70.0,
        "eligible_streams_or_branches": None,
        "tags": "National Honor,Class 10,Merit"
    },
    {
        "id": "cbse-single-girl-child-10",
        "title": "CBSE Single Girl Child Merit Scholarship",
        "provider": "Central Board of Secondary Education",
        "description": "Exclusive central scholarship for girl students who passed Class 10 with distinction to support their continuation into 11th and 12th grades.",
        "benefit_value": "₹500 / month tuition allowance (2 Years)",
        "deadline": "December 15, 2025",
        "eligible_stages": "class_10",
        "min_cgpa_or_percentage": 60.0,
        "eligible_streams_or_branches": None,
        "tags": "CBSE,Girls Education,Class 10"
    },
    {
        "id": "tata-building-india-10",
        "title": "Tata Building India Secondary School Award",
        "provider": "Tata Community Initiatives Trust",
        "description": "Merit award encouraging nation-building leadership, essay writing, and academic diligence among secondary school students.",
        "benefit_value": "₹25,000 cash award + Citation",
        "deadline": "November 10, 2025",
        "eligible_stages": "class_10",
        "min_cgpa_or_percentage": 65.0,
        "eligible_streams_or_branches": None,
        "tags": "Tata Trust,Class 10,Merit"
    },
    {
        "id": "vimarsh-young-science-10",
        "title": "Vimarsh Young Science Scholars Grant",
        "provider": "Department of Science & Technology",
        "description": "Identifying early mathematical and scientific aptitude in Class 10 students with sponsored research kits and secondary coaching.",
        "benefit_value": "₹18,000 annual science stipend",
        "deadline": "October 28, 2025",
        "eligible_stages": "class_10",
        "min_cgpa_or_percentage": 75.0,
        "eligible_streams_or_branches": None,
        "tags": "Science Talent,Class 10,STEM"
    },
    {
        "id": "aditya-birla-class10-scholar",
        "title": "Aditya Birla Secondary School Scholarship",
        "provider": "Aditya Birla Capital Foundation",
        "description": "Need-cum-merit education support providing textbook stipends and exam fee reimbursements for promising Class 10 achievers.",
        "benefit_value": "₹15,000 annual school grant",
        "deadline": "January 15, 2026",
        "eligible_stages": "class_10",
        "min_cgpa_or_percentage": 65.0,
        "eligible_streams_or_branches": None,
        "tags": "Need-Based,Class 10,School Fees"
    },

    # ==========================================
    # 2. INTERMEDIATE (11th & 12th) EXCLUSIVE SCHOLARSHIPS
    # ==========================================
    {
        "id": "inspire-she-scholarship-inter",
        "title": "INSPIRE Scholarship for Higher Education (SHE)",
        "provider": "Department of Science & Technology (Govt. of India)",
        "description": "Flagship government scholarship attracting young talent to natural and basic sciences during 11th/12th intermediate studies.",
        "benefit_value": "₹80,000 / year (₹60,000 cash + ₹20,000 mentor grant)",
        "deadline": "December 31, 2025",
        "eligible_stages": "intermediate",
        "min_cgpa_or_percentage": 80.0,
        "eligible_streams_or_branches": "MPC,BiPC,Science",
        "tags": "DST Inspire,Intermediate,STEM Research"
    },
    {
        "id": "dr-abdul-kalam-stem-inter",
        "title": "Dr. APJ Abdul Kalam Junior STEM Fellowship",
        "provider": "Foundation for Innovation & Science",
        "description": "Encouraging engineering and medical entrance aspirants in 11th and 12th with coaching sponsorships and lab access.",
        "benefit_value": "₹45,000 research grant + Mentor access",
        "deadline": "January 15, 2026",
        "eligible_stages": "intermediate",
        "min_cgpa_or_percentage": 75.0,
        "eligible_streams_or_branches": "MPC,BiPC",
        "tags": "STEM,Intermediate,JEE/NEET Prep"
    },
    {
        "id": "hdfc-badhte-kadam-inter",
        "title": "HDFC Bank Parivartan's ECS Intermediate Scholarship",
        "provider": "HDFC Bank CSR Foundation",
        "description": "Financial empowerment support for students pursuing Class 11 and 12 from low-income families across all educational streams.",
        "benefit_value": "₹35,000 annual education grant",
        "deadline": "November 30, 2025",
        "eligible_stages": "intermediate",
        "min_cgpa_or_percentage": 55.0,
        "eligible_streams_or_branches": "MPC,BiPC,MEC,CEC,Science,Commerce,Arts",
        "tags": "Need-Based,Intermediate,School Fees"
    },
    {
        "id": "sbi-asha-intermediate",
        "title": "SBI Asha Foundation Higher Secondary Scholarship",
        "provider": "SBI Foundation",
        "description": "Annual merit fellowship for high-achieving 11th and 12th grade scholars across recognized state and central junior colleges.",
        "benefit_value": "₹25,000 direct tuition transfer",
        "deadline": "October 31, 2025",
        "eligible_stages": "intermediate",
        "min_cgpa_or_percentage": 75.0,
        "eligible_streams_or_branches": "MPC,BiPC,MEC,Commerce,Science",
        "tags": "Banking CSR,Intermediate,Merit"
    },
    {
        "id": "aicte-pragati-intermediate",
        "title": "AICTE Pragati Junior Scholarship for Technical +2",
        "provider": "Ministry of Education (Govt. of India)",
        "description": "Government scholarship scheme assisting girl students pursuing +2 vocational technical streams and polytechnic diplomas.",
        "benefit_value": "₹50,000 / year tuition assistance",
        "deadline": "December 20, 2025",
        "eligible_stages": "intermediate",
        "min_cgpa_or_percentage": 60.0,
        "eligible_streams_or_branches": "MPC,Vocational Technical,Computer Science",
        "tags": "Government,Girls Education,Intermediate"
    },

    # ==========================================
    # 3. B.TECH EXCLUSIVE SCHOLARSHIPS
    # ==========================================
    {
        "id": "google-generation-apac-2025",
        "title": "Generation Google Scholarship (APAC)",
        "provider": "Google India & APAC",
        "description": "Awarded to aspiring computer science undergraduate students demonstrating leadership, diversity commitment, and technical excellence.",
        "benefit_value": "$2,500 USD grant + Global Tech Community",
        "deadline": "November 30, 2025",
        "eligible_stages": "b_tech",
        "min_cgpa_or_percentage": 8.0,
        "eligible_streams_or_branches": "Computer Science,Information Technology,Artificial Intelligence,Software Engineering",
        "tags": "Women in Tech,Computer Science,Global"
    },
    {
        "id": "reliance-foundation-ug-2025",
        "title": "Reliance Foundation Undergraduate STEM Scholarship",
        "provider": "Reliance Foundation",
        "description": "Prestigious national grant supporting meritorious undergraduate engineering and tech students with comprehensive leadership development.",
        "benefit_value": "₹2,00,000 grant over degree",
        "deadline": "October 15, 2025",
        "eligible_stages": "b_tech",
        "min_cgpa_or_percentage": 7.5,
        "eligible_streams_or_branches": "Computer Science,Electronics,Mechanical,Civil,Chemical,Information Technology,Data Science",
        "tags": "Merit-cum-Means,Undergraduate,STEM"
    },
    {
        "id": "amazon-future-engineer-btech",
        "title": "Amazon Future Engineer Scholarship & Mentorship",
        "provider": "Amazon India",
        "description": "Transformative opportunity providing annual college tuition support, an Amazon laptop, and direct mentorship from Amazon software developers.",
        "benefit_value": "₹50,000 / year + Laptop + Mentorship",
        "deadline": "December 15, 2025",
        "eligible_stages": "b_tech",
        "min_cgpa_or_percentage": 7.0,
        "eligible_streams_or_branches": "Computer Science,IT,ECE,Data Science,AI",
        "tags": "Corporate Tech,B.Tech,Mentorship"
    },
    {
        "id": "adobe-india-women-tech",
        "title": "Adobe India Women-in-Technology Scholarship",
        "provider": "Adobe Systems",
        "description": "Recognizing outstanding women engineering students in computing and engineering with substantial tuition grants and summer internship interview.",
        "benefit_value": "₹1,00,000 tuition grant + Adobe Internship",
        "deadline": "November 15, 2025",
        "eligible_stages": "b_tech",
        "min_cgpa_or_percentage": 8.0,
        "eligible_streams_or_branches": "Computer Science,Information Technology,Software Engineering",
        "tags": "Diversity in Tech,B.Tech,Internship"
    },
    {
        "id": "aicte-pragati-girls-2025",
        "title": "AICTE Pragati Engineering Degree Scholarship",
        "provider": "Ministry of Education (Govt. of India)",
        "description": "Government scheme providing continuous financial assistance for girl students admitted to first year of B.Tech degree programs in AICTE institutions.",
        "benefit_value": "₹50,000 per year towards degree tuition",
        "deadline": "December 31, 2025",
        "eligible_stages": "b_tech",
        "min_cgpa_or_percentage": 6.5,
        "eligible_streams_or_branches": "All Technical Streams,Engineering,Technology",
        "tags": "Government,Engineering,Degree"
    },
    {
        "id": "qualcomm-wetech-btech",
        "title": "Qualcomm WeTech Global STEM Scholarship",
        "provider": "Qualcomm & IIE",
        "description": "Fostering next-generation semiconductor and computing leaders with university scholarships and 6 months of 1-on-1 Qualcomm engineering mentorship.",
        "benefit_value": "$1,500 USD + Qualcomm Mentor",
        "deadline": "January 20, 2026",
        "eligible_stages": "b_tech",
        "min_cgpa_or_percentage": 7.5,
        "eligible_streams_or_branches": "ECE,EEE,CSE,VLSI,Embedded Systems",
        "tags": "Semiconductors,Hardware/Software,B.Tech"
    }
]


def seed_database(db: Session):
    """Populates initial scholarships and demo profile data if not present."""
    # Seed or update scholarships to ensure stage eligibility is accurate
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
        else:
            # Update fields in case they changed in seed definitions
            existing.title = item["title"]
            existing.provider = item["provider"]
            existing.description = item["description"]
            existing.benefit_value = item["benefit_value"]
            existing.deadline = item["deadline"]
            existing.eligible_stages = item["eligible_stages"]
            existing.min_cgpa_or_percentage = item["min_cgpa_or_percentage"]
            existing.eligible_streams_or_branches = item["eligible_streams_or_branches"]
            existing.tags = item["tags"]

    # Prune obsolete legacy scholarships not in current stage-exclusive catalogue
    valid_ids = [item["id"] for item in SEED_SCHOLARSHIPS]
    db.query(Scholarship).filter(Scholarship.id.notin_(valid_ids)).delete(synchronize_session=False)
    db.flush()

    # 1. B.TECH DEMO STUDENT: Arjun Sharma
    btech_email = "demo.student@skillcatalyst.dev"
    btech_student = db.query(Student).filter(Student.email == btech_email).first()
    if not btech_student:
        btech_student = Student(
            id="demo-student-uuid-001",
            name="Arjun Sharma",
            email=btech_email,
            date_of_birth="2003-08-14",
            location="Hyderabad, Telangana",
            education_stage="b_tech",
            target_role="Software Engineer"
        )
        db.add(btech_student)
        db.flush()

        db.add(AcademicProfile(
            student_id=btech_student.id,
            school_or_college="Hyderabad Institute of Technology & Management",
            board=None,
            university="JNTU Hyderabad",
            branch="Computer Science and Engineering",
            year="3rd Year",
            percentage=None,
            cgpa=8.42,
            stream=None,
            future_direction=None
        ))

        for name, prof in [("Python", "Advanced"), ("React", "Intermediate"), ("SQL", "Intermediate"), ("FastAPI", "Intermediate"), ("Git & GitHub", "Advanced")]:
            db.add(StudentSkill(student_id=btech_student.id, skill_name=name, proficiency=prof))

        db.add(StudentProject(
            student_id=btech_student.id,
            name="Ascend Intelligence Navigator",
            description="AI-guided pathway navigator mapping student profiles to curated scholarships.",
            technologies="Python, Next.js, SQLite, Tailwind CSS",
            github_url="https://github.com/arjunsharma/ascend"
        ))

        db.add(StudentPreference(
            student_id=btech_student.id,
            preferred_location="Hyderabad / Bangalore",
            available_learning_time="2–4 hours/day"
        ))

    # 2. CLASS 10 DEMO STUDENT: Rohan Verma
    class10_email = "demo.class10@skillcatalyst.dev"
    class10_student = db.query(Student).filter(Student.email == class10_email).first()
    if not class10_student:
        class10_student = Student(
            id="demo-student-uuid-002",
            name="Rohan Verma",
            email=class10_email,
            date_of_birth="2009-04-10",
            location="Hyderabad, Telangana",
            education_stage="class_10",
            target_role="Science Scholar"
        )
        db.add(class10_student)
        db.flush()

        db.add(AcademicProfile(
            student_id=class10_student.id,
            school_or_college="Delhi Public School, Hyderabad",
            board="CBSE",
            university=None,
            branch=None,
            year="Class 10",
            percentage=88.5,
            cgpa=None,
            stream=None,
            future_direction="Engineering / STEM"
        ))

        for interest in ["Computer Science", "Physics", "Mathematics"]:
            db.add(StudentInterest(student_id=class10_student.id, interest=interest))

        db.add(StudentPreference(
            student_id=class10_student.id,
            preferred_location="Hyderabad",
            available_learning_time="1–2 hours/day"
        ))

    # 3. INTERMEDIATE DEMO STUDENT: Priya Nair
    inter_email = "demo.intermediate@skillcatalyst.dev"
    inter_student = db.query(Student).filter(Student.email == inter_email).first()
    if not inter_student:
        inter_student = Student(
            id="demo-student-uuid-003",
            name="Priya Nair",
            email=inter_email,
            date_of_birth="2007-06-22",
            location="Secunderabad, Telangana",
            education_stage="intermediate",
            target_role="Engineering Aspirant"
        )
        db.add(inter_student)
        db.flush()

        db.add(AcademicProfile(
            student_id=inter_student.id,
            school_or_college="Narayana Junior College, Hyderabad",
            board="Telangana State Board (TSBIE)",
            university=None,
            branch=None,
            year="2nd Year (12th)",
            percentage=92.4,
            cgpa=None,
            stream="MPC",
            future_direction="Computer Science Engineering"
        ))

        for interest in ["Mathematics", "Computer Science", "Artificial Intelligence"]:
            db.add(StudentInterest(student_id=inter_student.id, interest=interest))

        db.add(StudentPreference(
            student_id=inter_student.id,
            preferred_location="Hyderabad",
            available_learning_time="3–4 hours/day"
        ))

    db.commit()
