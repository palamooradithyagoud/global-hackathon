from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.profile import Student
from backend.app.schemas.profile import DemoAuthRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/demo", response_model=AuthResponse)
def demo_login(payload: DemoAuthRequest = DemoAuthRequest(), db: Session = Depends(get_db)):
    """
    Hackathon optimized demo entry point.
    Returns a stable demo session and student identity.
    """
    stage = (payload.education_stage or "b_tech").strip().lower()
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
        return AuthResponse(
            token=f"demo-session-token-{student.education_stage}-verified",
            student_id=student.id,
            email=student.email,
            name=student.name,
            has_profile=True,
            education_stage=student.education_stage
        )
    
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
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Standard email/password login endpoint.
    If the user exists, returns profile status. Otherwise creates guest session.
    """
    student = db.query(Student).filter(Student.email == credentials.email).first()
    if student:
        return AuthResponse(
            token=f"auth-token-{student.id}",
            student_id=student.id,
            email=student.email,
            name=student.name,
            has_profile=True,
            education_stage=student.education_stage
        )
    
    name_derived = credentials.email.split("@")[0].replace(".", " ").title()
    return AuthResponse(
        token=f"auth-token-new-{name_derived}",
        student_id=None,
        email=credentials.email,
        name=name_derived,
        has_profile=False,
        education_stage="b_tech"
    )
