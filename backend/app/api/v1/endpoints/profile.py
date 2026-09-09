from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload, selectinload
from backend.app.services.n8n_service import trigger_student_registration_webhook
from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.profile import (
    Student, AcademicProfile, StudentSkill, StudentProject, StudentCertification,
    StudentExperience, StudentInterest, StudentPreference, StudentFinancialContext, Scholarship
)
from backend.app.schemas.profile import (
    StudentProfileCreate, StudentProfileUpdate, StudentProfileResponse,
    AcademicProfileResponse, SkillResponse, ProjectResponse, CertificationResponse,
    ExperienceResponse, PreferenceResponse, FinancialContextResponse, IntelligenceSummary
)
from backend.app.services.scholarship_matcher import compute_student_intelligence_summary

router = APIRouter(prefix="/profile", tags=["Student Profile"])


def build_profile_response(student: Student, db: Session) -> StudentProfileResponse:
    """Helper to convert relational Student entity to comprehensive typed response schema."""
    all_scholarships = cache.get_scholarships(db)
    intel_summary = compute_student_intelligence_summary(student, all_scholarships)

    acad_res = None
    if student.academic_profile:
        acad = student.academic_profile
        acad_res = AcademicProfileResponse(
            id=acad.id,
            student_id=acad.student_id,
            school_or_college=acad.school_or_college,
            board=acad.board,
            university=acad.university,
            branch=acad.branch,
            year=acad.year,
            percentage=acad.percentage,
            cgpa=acad.cgpa,
            stream=acad.stream,
            future_direction=acad.future_direction,
            created_at=acad.created_at
        )

    skills_res = [
        SkillResponse(
            id=s.id,
            student_id=s.student_id,
            skill_name=s.skill_name,
            proficiency=s.proficiency,
            created_at=s.created_at
        )
        for s in student.skills
    ]

    projects_res = [
        ProjectResponse(
            id=p.id,
            student_id=p.student_id,
            name=p.name,
            description=p.description,
            technologies=p.technologies,
            github_url=p.github_url,
            created_at=p.created_at
        )
        for p in student.projects
    ]

    certs_res = [
        CertificationResponse(
            id=c.id,
            student_id=c.student_id,
            name=c.name,
            issuer=c.issuer,
            date=c.date,
            credential_url=c.credential_url,
            created_at=c.created_at
        )
        for c in student.certifications
    ]

    exp_res = [
        ExperienceResponse(
            id=e.id,
            student_id=e.student_id,
            type=e.type,
            organization=e.organization,
            role=e.role,
            description=e.description,
            start_date=e.start_date,
            end_date=e.end_date,
            created_at=e.created_at
        )
        for e in student.experience
    ]

    pref_res = None
    if student.preferences:
        pref_res = PreferenceResponse(
            id=student.preferences.id,
            student_id=student.preferences.student_id,
            preferred_location=student.preferences.preferred_location,
            available_learning_time=student.preferences.available_learning_time
        )

    fin_res = None
    if student.financial_context:
        fin_res = FinancialContextResponse(
            id=student.financial_context.id,
            student_id=student.financial_context.student_id,
            education_budget=student.financial_context.education_budget,
            certification_budget=student.financial_context.certification_budget
        )

    interests_res = [i.interest for i in student.interests]

    return StudentProfileResponse(
        id=student.id,
        name=student.name,
        email=student.email,
        date_of_birth=student.date_of_birth,
        location=student.location,
        education_stage=student.education_stage,
        target_role=student.target_role,
        created_at=student.created_at,
        updated_at=student.updated_at,
        academic_profile=acad_res,
        skills=skills_res,
        projects=projects_res,
        certifications=certs_res,
        experience=exp_res,
        interests=interests_res,
        preferences=pref_res,
        financial_context=fin_res,
        intelligence_summary=intel_summary
    )


@router.post("", response_model=StudentProfileResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_student_profile(
    payload: StudentProfileCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Persists a comprehensive student intelligence profile across relational tables.
    Validates stage-specific criteria authoritatively.
    """
    # Check if student with email already exists
    student = db.query(Student).filter(Student.email == payload.email).first()

    if not student:
        student = Student(
            name=payload.name,
            email=payload.email,
            date_of_birth=payload.date_of_birth,
            location=payload.location,
            education_stage=payload.education_stage,
            target_role=payload.target_role
        )
        db.add(student)
        db.flush()
    else:
        student.name = payload.name
        student.date_of_birth = payload.date_of_birth
        student.location = payload.location
        student.education_stage = payload.education_stage
        student.target_role = payload.target_role
        
        # Clear previous child collections for a fresh update
        db.query(AcademicProfile).filter(AcademicProfile.student_id == student.id).delete()
        db.query(StudentSkill).filter(StudentSkill.student_id == student.id).delete()
        db.query(StudentProject).filter(StudentProject.student_id == student.id).delete()
        db.query(StudentCertification).filter(StudentCertification.student_id == student.id).delete()
        db.query(StudentExperience).filter(StudentExperience.student_id == student.id).delete()
        db.query(StudentInterest).filter(StudentInterest.student_id == student.id).delete()
        db.query(StudentPreference).filter(StudentPreference.student_id == student.id).delete()
        db.query(StudentFinancialContext).filter(StudentFinancialContext.student_id == student.id).delete()

    # 1. Academic Profile
    acad_data = payload.academic_profile
    academic = AcademicProfile(
        student_id=student.id,
        school_or_college=acad_data.school_or_college,
        board=acad_data.board,
        university=acad_data.university,
        branch=acad_data.branch,
        year=acad_data.year,
        percentage=acad_data.percentage,
        cgpa=acad_data.cgpa,
        stream=acad_data.stream,
        future_direction=acad_data.future_direction
    )
    db.add(academic)

    # 2. Skills
    for s in payload.skills:
        skill = StudentSkill(
            student_id=student.id,
            skill_name=s.skill_name.strip(),
            proficiency=s.proficiency
        )
        db.add(skill)

    # 3. Projects
    for p in payload.projects:
        project = StudentProject(
            student_id=student.id,
            name=p.name.strip(),
            description=p.description,
            technologies=p.technologies,
            github_url=p.github_url
        )
        db.add(project)

    # 4. Certifications
    for c in payload.certifications:
        cert = StudentCertification(
            student_id=student.id,
            name=c.name.strip(),
            issuer=c.issuer,
            date=c.date,
            credential_url=c.credential_url
        )
        db.add(cert)

    # 5. Experience
    for e in payload.experience:
        exp = StudentExperience(
            student_id=student.id,
            type=e.type,
            organization=e.organization,
            role=e.role,
            description=e.description,
            start_date=e.start_date,
            end_date=e.end_date
        )
        db.add(exp)

    # 6. Interests
    for item in payload.interests:
        if item.strip():
            db.add(StudentInterest(student_id=student.id, interest=item.strip()))

    # 7. Preferences
    if payload.preferences:
        pref = StudentPreference(
            student_id=student.id,
            preferred_location=payload.preferences.preferred_location,
            available_learning_time=payload.preferences.available_learning_time
        )
        db.add(pref)

    # 8. Financial Context
    if payload.financial_context:
        fin = StudentFinancialContext(
            student_id=student.id,
            education_budget=payload.financial_context.education_budget,
            certification_budget=payload.financial_context.certification_budget
        )
        db.add(fin)

    db.commit()
    db.refresh(student)
    
    # Trigger n8n Welcome Email automation workflow in background (deduped automatically)
    trigger_student_registration_webhook(student.id, db=db, background_tasks=background_tasks)

    cache.invalidate_student(student.id)
    resp = build_profile_response(student, db)
    cache.set_profile(student.id, resp)
    return resp


@router.get("/{student_id}", response_model=StudentProfileResponse)
def get_student_profile(student_id: str, db: Session = Depends(get_db)):
    """Retrieves full student profile by ID with caching and eager loading."""
    cached = cache.get_profile(student_id)
    if cached is not None:
        return cached

    student = (
        db.query(Student)
        .options(
            joinedload(Student.academic_profile),
            selectinload(Student.skills),
            selectinload(Student.projects),
            selectinload(Student.certifications),
            selectinload(Student.experience),
            selectinload(Student.interests),
            joinedload(Student.preferences),
            joinedload(Student.financial_context)
        )
        .filter(Student.id == student_id)
        .first()
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID '{student_id}' not found."
        )
    resp = build_profile_response(student, db)
    cache.set_profile(student_id, resp)
    return resp


@router.patch("/{student_id}", response_model=StudentProfileResponse)
def update_student_profile(student_id: str, payload: StudentProfileUpdate, db: Session = Depends(get_db)):
    """Applies partial updates to an existing profile."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID '{student_id}' not found."
        )

    if payload.name is not None:
        student.name = payload.name
    if payload.location is not None:
        student.location = payload.location
    if payload.target_role is not None:
        student.target_role = payload.target_role
    if payload.education_stage is not None:
        student.education_stage = payload.education_stage

    if payload.academic_profile:
        if not student.academic_profile:
            student.academic_profile = AcademicProfile(student_id=student.id)
            db.add(student.academic_profile)
        for k, v in payload.academic_profile.dict(exclude_unset=True).items():
            setattr(student.academic_profile, k, v)

    if payload.preferences:
        if not student.preferences:
            student.preferences = StudentPreference(student_id=student.id)
        for k, v in payload.preferences.dict(exclude_unset=True).items():
            setattr(student.preferences, k, v)

    if payload.financial_context:
        if not student.financial_context:
            student.financial_context = StudentFinancialContext(student_id=student.id)
        for k, v in payload.financial_context.dict(exclude_unset=True).items():
            setattr(student.financial_context, k, v)

    db.commit()
    db.refresh(student)
    cache.invalidate_student(student.id)
    resp = build_profile_response(student, db)
    cache.set_profile(student.id, resp)
    return resp
