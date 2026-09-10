from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.profile import Student, AcademicProfile, StudentSkill
from backend.app.schemas.profile import DemoAuthRequest, LoginRequest, RegisterRequest, AuthResponse
from backend.app.services.n8n_service import trigger_student_registration_webhook

router = APIRouter(prefix="/auth", tags=["Authentication"])


_demo_cache = {}

@router.post("/demo", response_model=AuthResponse)
def demo_login(payload: DemoAuthRequest = DemoAuthRequest(), db: Session = Depends(get_db)):
    """
    Hackathon optimized demo entry point.
    Returns a stable demo session and student identity.
    """
    stage = (payload.education_stage or "b_tech").strip().lower()
    if stage in _demo_cache:
        return _demo_cache[stage]

    email_map = {
        "class_10": "demo.class10@skillcatalyst.dev",
        "intermediate": "demo.intermediate@skillcatalyst.dev",
        "b_tech": "demo.student@skillcatalyst.dev",
    }
    target_email = email_map.get(stage, "demo.student@skillcatalyst.dev")
    student = db.query(Student).filter(Student.email == target_email).first()

    # Fallback to any student with matching stage
    if not student:
        student = db.query(Student).filter(Student.education_stage == stage).first()

    if student:
        res = AuthResponse(
            token=f"demo-session-token-{student.education_stage}-verified",
            student_id=student.id,
            email=student.email,
            name=student.name,
            has_profile=True,
            education_stage=student.education_stage
        )
        _demo_cache[stage] = res
        return res
    
    # New guest demo student instance
    return AuthResponse(
        token="demo-session-token-v1-guest",
        student_id=None,
        email="guest.demo@skillcatalyst.dev",
        name="Demo Student",
        has_profile=False,
        education_stage=payload.education_stage or "b_tech"
    )


@router.post("/login", response_model=AuthResponse)
def login(
    credentials: LoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Standard email/password login endpoint.
    If the user exists, returns their profile status.
    If new, initializes a student record in the database for seamless onboarding.
    Automatically triggers the welcome email workflow for new or un-notified users.
    """
    student = db.query(Student).filter(Student.email == credentials.email).first()
    if student:
        has_prof = bool(student.academic_profile)
        # Safely trigger welcome workflow if student has not received it yet
        trigger_student_registration_webhook(student.id, db=db, background_tasks=background_tasks)
        return AuthResponse(
            token=f"auth-token-{student.id}",
            student_id=student.id,
            email=student.email,
            name=student.name,
            has_profile=has_prof,
            education_stage=student.education_stage
        )
    
    # Initialize a new student record for this email
    name_derived = credentials.email.split("@")[0].replace(".", " ").title()
    new_student = Student(
        name=name_derived,
        email=credentials.email,
        education_stage="b_tech",
        location="Hyderabad, India"
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Automatically trigger n8n Welcome Email for new user login
    trigger_student_registration_webhook(new_student.id, db=db, background_tasks=background_tasks)

    return AuthResponse(
        token=f"auth-token-{new_student.id}",
        student_id=new_student.id,
        email=new_student.email,
        name=new_student.name,
        has_profile=False,
        education_stage=new_student.education_stage
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Creates a brand new student account with stage and year details.
    """
    stage = payload.education_stage.strip().lower()
    student = db.query(Student).filter(Student.email == payload.email).first()
    
    if student:
        student.name = payload.name
        student.education_stage = stage
        student.location = payload.location
    else:
        student = Student(
            name=payload.name,
            email=payload.email,
            education_stage=stage,
            location=payload.location,
            target_role="Software Engineer" if stage == "b_tech" else None
        )
        db.add(student)
        db.flush()

    # Academic profile setup
    acad = db.query(AcademicProfile).filter(AcademicProfile.student_id == student.id).first()
    if not acad:
        acad = AcademicProfile(student_id=student.id)
        db.add(acad)
    
    acad.school_or_college = payload.school_or_college or ("Engineering College" if stage == "b_tech" else "Junior College")
    acad.year = payload.year or ("1st Year" if stage == "b_tech" else "1st Year (11th)")
    
    if stage == "b_tech":
        acad.branch = payload.branch_or_stream or "Computer Science and Engineering"
        score_val = payload.score or 8.0
        acad.cgpa = float(score_val) if score_val <= 10.0 else (score_val / 10.0)
        acad.percentage = (acad.cgpa * 9.5) if acad.cgpa else 76.0
    else:
        acad.stream = payload.branch_or_stream or "MPC"
        acad.percentage = float(payload.score) if payload.score else 80.0

    # Starter skills for B.Tech if none
    if stage == "b_tech" and not student.skills:
        for s_name, prof in [("Python", "Advanced"), ("Data Structures", "Intermediate"), ("Web Development", "Intermediate")]:
            db.add(StudentSkill(student_id=student.id, skill_name=s_name, proficiency=prof))

    db.commit()
    db.refresh(student)

    # Trigger n8n Welcome Email automation workflow in background (non-blocking & fail-safe)
    trigger_student_registration_webhook(student.id, db=db, background_tasks=background_tasks)

    return AuthResponse(
        token=f"auth-token-reg-{student.id}",
        student_id=student.id,
        email=student.email,
        name=student.name,
        has_profile=True,
        education_stage=student.education_stage
    )
