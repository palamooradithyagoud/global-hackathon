from sqlalchemy.orm import Session
from backend.app.models.profile import (
    Scholarship, Student, AcademicProfile, StudentSkill, StudentProject,
    StudentCertification, StudentExperience, StudentInterest, StudentPreference, StudentFinancialContext
)

SEED_SCHOLARSHIPS = [
    # =========================================================================
    # 0. CLASS 10 SCHOLARSHIPS (5 REAL SCHOLARSHIPS)
    # =========================================================================
    {
        "id": "nmms-class10",
        "title": "NMMS Scholarship (National Means-cum-Merit Scholarship)",
        "provider": "Department of School Education & Literacy (Govt of India)",
        "description": "National scholarship providing financial assistance to meritorious students in Class 10 from economically weaker sections.",
        "current_study": "Class 10",
        "min_cgpa_or_percentage": 55.0,
        "amount_inr": 12000,
        "benefit_value": "₹12,000 / year",
        "deadline": "31-10-2026",
        "application_link": "https://scholarships.gov.in",
        "eligible_stages": "class_10",
        "eligible_streams_or_branches": None,
        "tags": "Class 10,Central Govt,NMMS,Merit-Need"
    },
    {
        "id": "cbse-single-girl-child-10th",
        "title": "CBSE Single Girl Child Scholarship",
        "provider": "Central Board of Secondary Education (CBSE)",
        "description": "Effort recognition and financial support to meritorious single girl students who are in Class 10 or have passed Class 10 from CBSE schools.",
        "current_study": "Class 10",
        "min_cgpa_or_percentage": 60.0,
        "amount_inr": 6000,
        "benefit_value": "₹6,000 / year",
        "deadline": "15-11-2026",
        "application_link": "https://www.cbse.gov.in",
        "eligible_stages": "class_10",
        "eligible_streams_or_branches": None,
        "tags": "Class 10,CBSE,Girl Child,Merit"
    },
    {
        "id": "prematric-minority-class10",
        "title": "Pre-Matric Scholarship for Minorities",
        "provider": "Ministry of Minority Affairs (Govt of India)",
        "description": "Financial assistance to encourage parents from minority communities to support their children through Class 10 secondary education.",
        "current_study": "Class 10",
        "min_cgpa_or_percentage": 50.0,
        "amount_inr": 5000,
        "benefit_value": "₹5,000 / year",
        "deadline": "30-11-2026",
        "application_link": "https://scholarships.gov.in",
        "eligible_stages": "class_10",
        "eligible_streams_or_branches": None,
        "tags": "Class 10,National Portal,Minority Affairs"
    },
    {
        "id": "vidyadhan-class10",
        "title": "Vidyadhan Class 10 Foundation Scholarship",
        "provider": "Sarojini Damodaran Foundation",
        "description": "Support program by Sarojini Damodaran Foundation for students completing Class 10 with outstanding academic achievements from challenged families.",
        "current_study": "Class 10",
        "min_cgpa_or_percentage": 90.0,
        "amount_inr": 10000,
        "benefit_value": "₹10,000 / year",
        "deadline": "30-06-2026",
        "application_link": "https://www.vidyadhan.org/apply",
        "eligible_stages": "class_10",
        "eligible_streams_or_branches": None,
        "tags": "Class 10,Merit,Foundation"
    },
    {
        "id": "tata-building-india-class10",
        "title": "Tata Building India Scholarship Grant",
        "provider": "Tata Group CSR",
        "description": "National level school competition and talent grant honoring meritorious Class 10 thinkers and problem solvers across Indian schools.",
        "current_study": "Class 10",
        "min_cgpa_or_percentage": 60.0,
        "amount_inr": 15000,
        "benefit_value": "₹15,000 / grant",
        "deadline": "25-12-2026",
        "application_link": "https://www.tatabuildingindia.com",
        "eligible_stages": "class_10",
        "eligible_streams_or_branches": None,
        "tags": "Class 10,Tata Group,Excellence"
    },

    # =========================================================================
    # 1. INTERMEDIATE SCHOLARSHIPS (5 REAL SCHOLARSHIPS)
    # =========================================================================
    {
        "id": "vidyadhan-intermediate",
        "title": "Vidyadhan Scholarship",
        "provider": "Sarojini Damodaran Foundation",
        "description": "Financial scholarship by Sarojini Damodaran Foundation encouraging meritorious students to complete Intermediate (11th/12th) education.",
        "current_study": "Intermediate",
        "min_cgpa_or_percentage": 90.0,
        "amount_inr": 10000,
        "benefit_value": "₹10,000 / year",
        "deadline": "30-06-2026",
        "application_link": "https://www.vidyadhan.org/apply",
        "eligible_stages": "intermediate",
        "eligible_streams_or_branches": "MPC,BiPC,MEC,CEC,HEC,Science,Commerce",
        "tags": "Intermediate,Merit,Foundation"
    },
    {
        "id": "epass-intermediate",
        "title": "Epass Scholarship",
        "provider": "Telangana ePASS (Govt of Telangana)",
        "description": "Pre-matric and post-matric financial assistance for students pursuing Intermediate education in Telangana state.",
        "current_study": "Intermediate",
        "min_cgpa_or_percentage": 35.0,
        "amount_inr": 5000,
        "benefit_value": "₹5,000 / year",
        "deadline": "30-09-2026",
        "application_link": "https://telanganaepass.cgg.gov.in/PrematricLinks.do",
        "eligible_stages": "intermediate",
        "eligible_streams_or_branches": None,
        "tags": "Intermediate,State Govt,ePASS"
    },
    {
        "id": "sbi-asha-intermediate-1st-year",
        "title": "SBI ASHA Scholarship",
        "provider": "State Bank of India (SBI Foundation)",
        "description": "SBI Foundation scholarship program providing financial assistance to meritorious students admitted into Intermediate 1st Year.",
        "current_study": "Intermediate 1st Year",
        "min_cgpa_or_percentage": 75.0,
        "amount_inr": 15000,
        "benefit_value": "₹15,000 / year",
        "deadline": "19-09-2026",
        "application_link": "https://www.sbiashascholarship.co.in/auth?mode=signup",
        "eligible_stages": "intermediate",
        "eligible_streams_or_branches": None,
        "tags": "Intermediate 1st Year,SBI Foundation,Merit-Need"
    },
    {
        "id": "lic-silver-jubilee-intermediate",
        "title": "LIC Silver Jubile Scholarship",
        "provider": "Life Insurance Corporation of India (LIC GJSS)",
        "description": "Golden Jubilee scholarship support for economically challenged students enrolled in Intermediate / Higher Secondary.",
        "current_study": "Intermediate",
        "min_cgpa_or_percentage": 35.0,
        "amount_inr": 40000,
        "benefit_value": "₹40,000 / year",
        "deadline": "30-09-2026",
        "application_link": "https://gjss.licindia.in/GJSS/?_ga=2.244227333.1878720104.1788317600-978755654.1785413535",
        "eligible_stages": "intermediate",
        "eligible_streams_or_branches": None,
        "tags": "Intermediate,LIC GJSS,Financial Support"
    },
    {
        "id": "dr-rajendra-prasad-intermediate",
        "title": "Dr Rajendra Prasad Scholarship Program 2026-27",
        "provider": "Buddy4Study / Dr. Rajendra Prasad Trust",
        "description": "Special educational grant for students in 11th/12th Intermediate to cover school tuition, books, and examination fees.",
        "current_study": "Intermediate",
        "min_cgpa_or_percentage": 75.0,
        "amount_inr": 30000,
        "benefit_value": "₹30,000 / year",
        "deadline": "30-09-2026",
        "application_link": "https://www.buddy4study.com/page/dr-rajendra-prasad-scholarship-program#scholarships",
        "eligible_stages": "intermediate",
        "eligible_streams_or_branches": None,
        "tags": "Intermediate,Buddy4Study,Merit-Cum-Means"
    },

    # =========================================================================
    # 2. B.TECH SCHOLARSHIPS (15 REAL SCHOLARSHIPS)
    # =========================================================================
    {
        "id": "epass-btech-1st-year",
        "title": "Epass Scholarship",
        "provider": "Telangana ePASS (Govt of Telangana)",
        "description": "Telangana ePASS post-matric reimbursement scheme for 1st Year Engineering (B.Tech) undergraduates.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 35.0,
        "amount_inr": 6500,
        "benefit_value": "₹6,500 / year",
        "deadline": "10-11-2026",
        "application_link": "https://telanganaepass.cgg.gov.in/epassonlinelinks.do",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 1st Year,Telangana,Fee Reimbursement"
    },
    {
        "id": "epass-btech-2nd-year",
        "title": "Epass Scholarship",
        "provider": "Telangana ePASS (Govt of Telangana)",
        "description": "Telangana ePASS post-matric renewal scheme for 2nd Year Engineering (B.Tech) undergraduates.",
        "current_study": "B.Tech 2nd Year",
        "min_cgpa_or_percentage": 35.0,
        "amount_inr": 6500,
        "benefit_value": "₹6,500 / year",
        "deadline": "18-08-2026",
        "application_link": "https://telanganaepass.cgg.gov.in/epassonlinelinks.do",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 2nd Year,Telangana,Fee Reimbursement"
    },
    {
        "id": "epass-btech-3rd-year",
        "title": "Epass Scholarship",
        "provider": "Telangana ePASS (Govt of Telangana)",
        "description": "Telangana ePASS post-matric renewal scheme for 3rd Year Engineering (B.Tech) undergraduates.",
        "current_study": "B.Tech 3rd Year",
        "min_cgpa_or_percentage": 35.0,
        "amount_inr": 6500,
        "benefit_value": "₹6,500 / year",
        "deadline": "18-08-2026",
        "application_link": "https://telanganaepass.cgg.gov.in/epassonlinelinks.do",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 3rd Year,Telangana,Fee Reimbursement"
    },
    {
        "id": "epass-btech-4th-year",
        "title": "Epass Scholarship",
        "provider": "Telangana ePASS (Govt of Telangana)",
        "description": "Telangana ePASS post-matric final year scheme for 4th Year Engineering (B.Tech) undergraduates.",
        "current_study": "B.Tech 4th Year",
        "min_cgpa_or_percentage": 35.0,
        "amount_inr": 6500,
        "benefit_value": "₹6,500 / year",
        "deadline": "18-08-2026",
        "application_link": "https://telanganaepass.cgg.gov.in/epassonlinelinks.do",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 4th Year,Telangana,Fee Reimbursement"
    },
    {
        "id": "sbi-asha-btech-1st-year",
        "title": "SBI ASHA Scholarship",
        "provider": "State Bank of India (SBI Foundation)",
        "description": "Premier SBI Foundation education support for 1st Year Engineering (B.Tech) students studying in recognized colleges across India.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 75.0,
        "amount_inr": 75000,
        "benefit_value": "₹75,000 / year",
        "deadline": "19-09-2026",
        "application_link": "https://www.sbiashascholarship.co.in/auth?mode=signup",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 1st Year,SBI Foundation,Engineering Merit"
    },
    {
        "id": "lic-silver-jubilee-btech-1st-year",
        "title": "LIC Silver Jubile Scholarship",
        "provider": "Life Insurance Corporation of India (LIC GJSS)",
        "description": "LIC Golden Jubilee scholarship for students admitted into 1st Year Engineering (B.Tech) to complete their technical degree.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 35.0,
        "amount_inr": 40000,
        "benefit_value": "₹40,000 / year",
        "deadline": "30-10-2026",
        "application_link": "https://gjss.licindia.in/GJSS/?_ga=2.244227333.1878720104.1788317600-978755654.1785413535",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 1st Year,LIC GJSS,Technical Degree"
    },
    {
        "id": "reliance-scholarship-btech-1st-year",
        "title": "Reliance Scholarship",
        "provider": "Reliance Foundation",
        "description": "Prestigious undergraduate scholarship by Reliance Foundation for 1st Year B.Tech students in Computer Science, IT, and core engineering streams.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 65.0,
        "amount_inr": 50000,
        "benefit_value": "₹50,000 / year",
        "deadline": "30-10-2026",
        "application_link": "https://www.buddy4study.com/page/reliance-foundation-scholarships",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": "Computer Science,Information Technology,ECE,EEE,Mechanical,Civil,Engineering",
        "tags": "B.Tech 1st Year,Reliance Foundation,Tech Grant"
    },
    {
        "id": "nsp-btech-1st-year",
        "title": "NSP",
        "provider": "National Scholarship Portal (Govt of India)",
        "description": "Central Sector Scheme of Scholarships for College and University Students offered through the National Scholarship Portal.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 75.0,
        "amount_inr": 12000,
        "benefit_value": "₹12,000 / year",
        "deadline": "05-11-2026",
        "application_link": "https://scholarships.gov.in/",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 1st Year,National Portal,Central Sector"
    },
    {
        "id": "ongc-scholarship-btech-1st-year",
        "title": "ONGC",
        "provider": "Oil and Natural Gas Corporation (ONGC Foundation)",
        "description": "ONGC Foundation scholarship support for meritorious students pursuing 1st year Engineering (B.Tech) degrees.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 65.0,
        "amount_inr": 48000,
        "benefit_value": "₹48,000 / year",
        "deadline": "20-06-2026",
        "application_link": "https://www.buddy4study.com/page/ongc-scholarship-to-meritorious-students",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": "Engineering,Computer Science,ECE,EEE,Mechanical,Civil",
        "tags": "B.Tech 1st Year,ONGC Foundation,PSU Grant"
    },
    {
        "id": "tata-capital-pankh-btech-1st-year",
        "title": "Tata Capital Pankh Scholarship Program 2026-27",
        "provider": "Tata Capital Foundation",
        "description": "Tata Capital initiative aimed at supporting 1st Year B.Tech students from economically underprivileged backgrounds to cover tuition expenses.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 75.0,
        "amount_inr": 18000,
        "benefit_value": "₹18,000 / year",
        "deadline": "26-10-2026",
        "application_link": "https://www.buddy4study.com/page/the-tata-capital-pankh-scholarship-programme",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 1st Year,Tata Capital,Pankh Programme"
    },
    {
        "id": "idfc-first-bank-btech-1st-year",
        "title": "IDFC FIRST Bank Engineering Scholarship Programme 2026-30",
        "provider": "IDFC FIRST Bank CSR",
        "description": "Comprehensive 4-year financial grant for 1st Year B.Tech engineering students enrolled in recognized universities.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 75.0,
        "amount_inr": 100000,
        "benefit_value": "₹1,00,000 / year",
        "deadline": "20-09-2026",
        "application_link": "https://www.buddy4study.com/page/idfc-first-bank-engineering-scholarship",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 1st Year,IDFC FIRST Bank,Engineering Excellence"
    },
    {
        "id": "parivartan-ecss-btech-1st-year",
        "title": "Parivartan ECSS Programme 2026-27",
        "provider": "HDFC Bank Parivartan",
        "description": "HDFC Bank Educational Crisis Scholarship Support (ECSS) for 1st Year B.Tech students facing educational disruption or financial distress.",
        "current_study": "B.Tech 1st Year",
        "min_cgpa_or_percentage": 75.0,
        "amount_inr": 75000,
        "benefit_value": "₹75,000 / year",
        "deadline": "31-10-2026",
        "application_link": "https://www.buddy4study.com/page/hdfc-bank-parivartans-ecss-programme#scholarships",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 1st Year,HDFC Parivartan,ECSS Support"
    },
    {
        "id": "sbi-asha-btech-2nd-year",
        "title": "SBI ASHA Scholarship",
        "provider": "State Bank of India (SBI Foundation)",
        "description": "SBI Foundation scholarship for 2nd Year Engineering (B.Tech) undergraduates maintaining consistent academic distinction.",
        "current_study": "B.Tech 2nd Year",
        "min_cgpa_or_percentage": 65.0,
        "amount_inr": 75000,
        "benefit_value": "₹75,000 / year",
        "deadline": "19-09-2026",
        "application_link": "https://www.sbiashascholarship.co.in/auth?mode=signup",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 2nd Year,SBI Foundation,Engineering Renewal"
    },
    {
        "id": "sbi-asha-btech-3rd-year",
        "title": "SBI ASHA Scholarship",
        "provider": "State Bank of India (SBI Foundation)",
        "description": "SBI Foundation scholarship for 3rd Year Engineering (B.Tech) undergraduates to support advanced technical coursework and projects.",
        "current_study": "B.Tech 3rd Year",
        "min_cgpa_or_percentage": 65.0,
        "amount_inr": 75000,
        "benefit_value": "₹75,000 / year",
        "deadline": "19-09-2026",
        "application_link": "https://www.sbiashascholarship.co.in/auth?mode=signup",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 3rd Year,SBI Foundation,Pre-Final Year"
    },
    {
        "id": "sbi-asha-btech-4th-year",
        "title": "SBI ASHA Scholarship",
        "provider": "State Bank of India (SBI Foundation)",
        "description": "SBI Foundation scholarship for final year 4th Year Engineering (B.Tech) students completing degree projects and capstones.",
        "current_study": "B.Tech 4th Year",
        "min_cgpa_or_percentage": 65.0,
        "amount_inr": 75000,
        "benefit_value": "₹75,000 / year",
        "deadline": "19-09-2026",
        "application_link": "https://www.sbiashascholarship.co.in/auth?mode=signup",
        "eligible_stages": "b_tech",
        "eligible_streams_or_branches": None,
        "tags": "B.Tech 4th Year,SBI Foundation,Final Year Capstone"
    }
]


def seed_database(db: Session):
    """Populates initial scholarships and demo profile data with batched queries."""
    valid_ids = set(item["id"] for item in SEED_SCHOLARSHIPS)
    existing_all = db.query(Scholarship).all()
    existing_map = {s.id: s for s in existing_all}

    for item in SEED_SCHOLARSHIPS:
        existing = existing_map.get(item["id"])
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
                tags=item["tags"],
                application_link=item["application_link"],
                current_study=item["current_study"],
                amount_inr=item["amount_inr"]
            )
            db.add(scholarship)
        else:
            existing.title = item["title"]
            existing.provider = item["provider"]
            existing.description = item["description"]
            existing.benefit_value = item["benefit_value"]
            existing.deadline = item["deadline"]
            existing.eligible_stages = item["eligible_stages"]
            existing.min_cgpa_or_percentage = item["min_cgpa_or_percentage"]
            existing.eligible_streams_or_branches = item["eligible_streams_or_branches"]
            existing.tags = item["tags"]
            existing.application_link = item["application_link"]
            existing.current_study = item["current_study"]
            existing.amount_inr = item["amount_inr"]

    db.flush()

    # Query all demo students in a single batch query
    demo_emails = [
        "demo.student@skillcatalyst.dev",
        "demo.class10@skillcatalyst.dev",
        "demo.intermediate@skillcatalyst.dev"
    ]
    existing_students = {s.email: s for s in db.query(Student).filter(Student.email.in_(demo_emails)).all()}

    # 2. B.TECH DEMO STUDENT: Arjun Sharma
    btech_email = "demo.student@skillcatalyst.dev"
    btech_student = existing_students.get(btech_email)
    if not btech_student:
        btech_student = Student(
            id="demo-student-uuid-001",
            name="Arjun Sharma",
            email=btech_email,
            date_of_birth="2003-05-15",
            location="Bengaluru, India",
            education_stage="b_tech",
            target_role="Full Stack Developer"
        )
        db.add(btech_student)
        db.flush()

        db.add(AcademicProfile(
            student_id=btech_student.id,
            school_or_college="National Institute of Technology",
            board=None,
            university="NIT",
            branch="Computer Science and Engineering",
            year="3rd Year",
            percentage=88.0,
            cgpa=8.8,
            stream=None,
            future_direction="Full Stack Engineering"
        ))

        skills_data = [
            ("Python", "Advanced"),
            ("React", "Advanced"),
            ("SQL", "Intermediate"),
            ("FastAPI", "Advanced"),
            ("Git & GitHub", "Advanced"),
            ("Data Structures", "Intermediate")
        ]
        for s_name, prof in skills_data:
            db.add(StudentSkill(student_id=btech_student.id, skill_name=s_name, proficiency=prof))

        db.add(StudentProject(
            student_id=btech_student.id,
            name="SkillCatalyst Platform",
            description="AI-driven career pathing and scholarship matching engine built with FastAPI and React.",
            technologies="Python, FastAPI, Next.js, PostgreSQL",
            github_url="https://github.com/example/skillcatalyst"
        ))

        db.add(StudentCertification(
            student_id=btech_student.id,
            name="AWS Certified Cloud Practitioner",
            issuer="Amazon Web Services",
            date="2024-03-10",
            credential_url="https://aws.amazon.com"
        ))

        db.add(StudentExperience(
            student_id=btech_student.id,
            type="internship",
            organization="InnoTech Labs",
            role="Backend Developer Intern",
            description="Built microservices using FastAPI and optimized database indexing.",
            start_date="Jun 2024",
            end_date="Aug 2024"
        ))

        for interest in ["Cloud Architecture", "System Design", "Distributed Systems"]:
            db.add(StudentInterest(student_id=btech_student.id, interest=interest))

        db.add(StudentPreference(
            student_id=btech_student.id,
            preferred_location="Bengaluru / Hybrid",
            available_learning_time="2–4 hours/day"
        ))

        db.add(StudentFinancialContext(
            student_id=btech_student.id,
            education_budget="₹10,000 - ₹25,000",
            certification_budget="₹5,000 - ₹10,000"
        ))

    # 3. CLASS 10 DEMO STUDENT: Rohan Verma
    class10_email = "demo.class10@skillcatalyst.dev"
    class10_student = existing_students.get(class10_email)
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

    # 4. INTERMEDIATE DEMO STUDENT: Priya Nair
    inter_email = "demo.intermediate@skillcatalyst.dev"
    inter_student = existing_students.get(inter_email)
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
