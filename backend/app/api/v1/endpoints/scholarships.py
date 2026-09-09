from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from backend.app.core.database import get_db
from backend.app.core.cache import cache
from backend.app.models.profile import Scholarship, Student
from backend.app.schemas.profile import ScholarshipResponse, PersonalizedScholarshipResponse
from backend.app.services.scholarship_matcher import evaluate_scholarship_eligibility

router = APIRouter(prefix="/scholarships", tags=["Scholarships"])


def matches_study_year(current_study: Optional[str], student_year: Optional[str]) -> bool:
    """
    Enforces strict year isolation so a 1st year student never gets
    2nd, 3rd, or 4th year opportunities, and vice versa.
    """
    if not current_study or not student_year:
        return True
    
    study_lower = current_study.strip().lower()
    student_lower = student_year.strip().lower()

    year_map = {
        "1st": ["1st", "first", "1", "11th"],
        "2nd": ["2nd", "second", "2", "12th"],
        "3rd": ["3rd", "3trd", "third", "3"],
        "4th": ["4th", "fourth", "4"]
    }

    scholarship_target_years = set()
    for yr_key, aliases in year_map.items():
        if any(alias in study_lower for alias in aliases):
            scholarship_target_years.add(yr_key)

    # If the scholarship doesn't specify an explicit study year, it applies to all years of that stage
    if not scholarship_target_years:
        return True

    # Identify the student's study year
    student_years = set()
    for yr_key, aliases in year_map.items():
        if any(alias in student_lower for alias in aliases):
            student_years.add(yr_key)

    if not student_years:
        return True

    # Allow only if there is a direct intersection
    return bool(scholarship_target_years.intersection(student_years))


@router.get("/preview", response_model=List[ScholarshipResponse])
def get_scholarship_preview(
    limit: int = 50,
    stage: Optional[str] = Query(None, description="Optional education stage to filter preview (class_10, intermediate, b_tech)"),
    year: Optional[str] = Query(None, description="Optional academic year filter (e.g. '1st Year')"),
    db: Session = Depends(get_db)
):
    """
    Returns realistic scholarship opportunities for the preview value hook.
    Optionally filters strictly by educational stage and academic year.
    Status remains 'Eligibility not checked yet' until profile is constructed.
    Uses in-memory cache for sub-millisecond responses.
    """
    cache_key = f"{limit}:{stage or ''}:{year or ''}"
    cached = cache.get_preview(cache_key)
    if cached is not None:
        return cached

    all_scholarships = cache.get_scholarships(db)
    filtered = all_scholarships

    if stage:
        target_stage = stage.strip().lower()
        filtered = [
            s for s in filtered
            if target_stage in [st.strip().lower() for st in s.eligible_stages.split(",")]
        ]

    if year:
        filtered = [s for s in filtered if matches_study_year(s.current_study, year)]

    scholarships = filtered[:limit]

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
                eligibility_status="Eligibility not checked yet",
                application_link=s.application_link,
                application_url=s.application_link,
                current_study=s.current_study,
                amount_inr=s.amount_inr
            )
        )
    cache.set_preview(cache_key, results)
    return results


@router.get("/personalized", response_model=List[PersonalizedScholarshipResponse])
def get_personalized_scholarships(student_id: str = Query(..., description="ID of the student profile"), db: Session = Depends(get_db)):
    """
    Evaluates scholarships against the student's authoritative database profile.
    Strictly filters to opportunities matching the student's education stage
    AND academic year (e.g., 1st Year B.Tech gets ONLY 1st Year B.Tech scholarships).
    Uses in-memory caching and eager-loading to deliver sub-millisecond evaluation.
    """
    cached = cache.get_personalized(student_id)
    if cached is not None:
        return cached

    student = (
        db.query(Student)
        .options(joinedload(Student.academic_profile))
        .filter(Student.id == student_id)
        .first()
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID '{student_id}' not found."
        )

    all_scholarships = cache.get_scholarships(db)

    # Strictly filter by student's exact education stage AND academic year
    student_stage = student.education_stage.strip().lower()
    student_year = student.academic_profile.year if student.academic_profile else None

    stage_scholarships = [
        s for s in all_scholarships
        if student_stage in [st.strip().lower() for st in s.eligible_stages.split(",")]
        and matches_study_year(s.current_study, student_year)
    ]

    personalized = []
    for s in stage_scholarships:
        res = evaluate_scholarship_eligibility(s, student)
        personalized.append(res)

    # Sort primarily by eligibility, then descending by match_score
    personalized.sort(key=lambda x: (x.is_eligible, x.match_score), reverse=True)
    cache.set_personalized(student_id, personalized)
    return personalized
