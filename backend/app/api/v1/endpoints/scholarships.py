from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.profile import Scholarship, Student
from backend.app.schemas.profile import ScholarshipResponse, PersonalizedScholarshipResponse
from backend.app.services.scholarship_matcher import evaluate_scholarship_eligibility

router = APIRouter(prefix="/scholarships", tags=["Scholarships"])


@router.get("/preview", response_model=List[ScholarshipResponse])
def get_scholarship_preview(limit: int = 5, db: Session = Depends(get_db)):
    """
    Returns 3–5 realistic scholarship opportunities for the preview value hook.
    Status remains 'Eligibility not checked yet' until profile is constructed.
    """
    scholarships = db.query(Scholarship).limit(limit).all()
    results = []
    for s in scholarships:
        tags = [t.strip() for t in s.tags.split(",")] if s.tags else []
        stages = [st.strip() for st in s.eligible_stages.split(",")]
        branches = [b.strip() for b in s.eligible_streams_or_branches.split(",")] if s.eligible_streams_or_branches else None
        results.append(
            ScholarshipResponse(
                id=s.id,
                title=s.title,
                provider=s.provider,
                description=s.description,
                benefit_value=s.benefit_value,
                deadline=s.deadline,
                min_cgpa_or_percentage=s.min_cgpa_or_percentage,
                eligible_stages=stages,
                eligible_streams_or_branches=branches,
                tags=tags,
                eligibility_status="Eligibility not checked yet"
            )
        )
    return results


@router.get("/personalized", response_model=List[PersonalizedScholarshipResponse])
def get_personalized_scholarships(student_id: str = Query(..., description="ID of the student profile"), db: Session = Depends(get_db)):
    """
    Evaluates all scholarships against the student's authoritative database profile
    and returns sorted opportunities with match scores, eligibility tags, and reasons.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID '{student_id}' not found."
        )

    all_scholarships = db.query(Scholarship).all()
    personalized = []
    for s in all_scholarships:
        res = evaluate_scholarship_eligibility(s, student)
        personalized.append(res)

    # Sort primarily by eligibility, then descending by match_score
    personalized.sort(key=lambda x: (x.is_eligible, x.match_score), reverse=True)
    return personalized
