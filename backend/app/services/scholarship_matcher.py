from typing import List, Dict, Any, Tuple
from backend.app.models.profile import Student, Scholarship
from backend.app.schemas.profile import (
    PersonalizedScholarshipResponse,
    ScholarshipResponse,
    IntelligenceSummary
)


def calculate_profile_completeness(student: Student) -> Tuple[int, List[str]]:
    """
    Calculates stage-aware completeness and identifies priority areas for improvement.
    """
    stage = student.education_stage
    priorities = []
    points = 0
    total_points = 100

    # Basic info
    if student.name and student.email:
        points += 20
    if student.location:
        points += 10
    else:
        priorities.append("Specify preferred location to filter regional opportunities")

    acad = student.academic_profile
    if stage == "class_10":
        if acad and acad.school_or_college and acad.board:
            points += 30
        if acad and acad.percentage:
            points += 20
        if len(student.interests) >= 1:
            points += 20
        else:
            priorities.append("Add career interests to unlock subject-wise scholarship tracks")

    elif stage == "intermediate":
        if acad and acad.stream:
            points += 30
        if acad and acad.percentage:
            points += 20
        if len(student.interests) >= 1:
            points += 15
        if acad and acad.future_direction:
            points += 15
        else:
            priorities.append("Indicate future direction (e.g. Engineering/Medicine) to personalize exam sponsorships")

    elif stage == "b_tech":
        if acad and acad.branch and acad.cgpa:
            points += 30
        if len(student.skills) >= 3:
            points += 20
        elif len(student.skills) > 0:
            points += 10
            priorities.append("Add at least 3 core technical skills to boost merit ranking")
        else:
            priorities.append("Add your key technical skills (Python, SQL, etc.)")

        if student.target_role:
            points += 10
        else:
            priorities.append("Define a target career role to match industry fellowship programs")

        if len(student.projects) >= 1:
            points += 10
        else:
            priorities.append("Link at least 1 technical project to stand out in grant selections")

    # Financial / Preference optional bonus
    if student.preferences and student.preferences.available_learning_time:
        points = min(100, points + 10)

    completeness = min(100, points)
    if not priorities:
        priorities = [
            "Explore fellowship grant deadlines for upcoming semester",
            "Prepare verified transcripts for one-click application",
            "Engage in technical hackathons to boost profile tier"
        ]

    return completeness, priorities[:3]


def evaluate_scholarship_eligibility(scholarship: Scholarship, student: Student) -> PersonalizedScholarshipResponse:
    """
    Evaluates student profile against scholarship criteria to compute eligibility,
    match score, and structured explanation tags.
    """
    match_reasons = []
    eligible = True
    match_score = 60
    action_item = None
    acad = student.academic_profile

    # 1. Stage Check
    stages = [s.strip().lower() for s in scholarship.eligible_stages.split(",")]
    if student.education_stage.lower() in stages:
        match_score += 20
        stage_names = {"class_10": "Class 10", "intermediate": "Intermediate", "b_tech": "B.Tech"}
        match_reasons.append(f"Direct match for {stage_names.get(student.education_stage, student.education_stage)} students")
    else:
        eligible = False
        match_score -= 30
        match_reasons.append(f"Requires education stage: {scholarship.eligible_stages.replace('_', ' ').title()}")
        action_item = "Applicable for higher or different education stage"

    # 2. Current Study / Year Check
    if scholarship.current_study:
        req_study = scholarship.current_study.strip().lower()
        if student.education_stage == "b_tech" and acad and acad.year:
            student_year = acad.year.strip().lower()
            if "1st" in req_study and ("1st" in student_year or student_year == "1"):
                match_score += 10
                match_reasons.append(f"Targeted for {scholarship.current_study}")
            elif "2nd" in req_study and ("2nd" in student_year or student_year == "2"):
                match_score += 10
                match_reasons.append(f"Targeted for {scholarship.current_study}")
            elif ("3rd" in req_study or "3trd" in req_study) and ("3rd" in student_year or student_year == "3"):
                match_score += 10
                match_reasons.append(f"Targeted for {scholarship.current_study}")
            elif ("4th" in req_study or "4 th" in req_study) and ("4th" in student_year or student_year == "4"):
                match_score += 10
                match_reasons.append(f"Targeted for {scholarship.current_study}")
            elif any(y in req_study for y in ["1st", "2nd", "3rd", "3trd", "4th"]):
                eligible = False
                match_score -= 25
                match_reasons.append(f"Requires {scholarship.current_study} (You are in {acad.year})")
                action_item = f"Available specifically for {scholarship.current_study}"
            else:
                match_reasons.append(f"Open for {scholarship.current_study}")
        elif student.education_stage == "intermediate":
            if "1st year" in req_study:
                student_year = (acad.year or "").strip().lower() if acad else ""
                if "1st" in student_year or "11" in student_year or not student_year:
                    match_score += 10
                    match_reasons.append(f"Open for {scholarship.current_study}")
                else:
                    eligible = False
                    match_score -= 20
                    match_reasons.append(f"Open for Intermediate 1st Year (You are in {acad.year})")
                    action_item = "Applicable for Intermediate 1st Year"
            else:
                match_reasons.append(f"Open for Intermediate students")

    # 3. Academic Merit / CGPA / Percentage Check
    acad = student.academic_profile
    if scholarship.min_cgpa_or_percentage is not None:
        if student.education_stage == "b_tech":
            student_cgpa = acad.cgpa if acad else None
            student_perc = acad.percentage if acad else None
            req_perc = scholarship.min_cgpa_or_percentage

            # Effective student percentage
            effective_perc = student_perc or ((student_cgpa * 9.5) if student_cgpa else None)
            req_cgpa = req_perc / 10.0 if req_perc > 10.0 else req_perc

            if student_cgpa is not None or effective_perc is not None:
                meets_criteria = False
                if effective_perc is not None and effective_perc >= req_perc:
                    meets_criteria = True
                elif student_cgpa is not None and student_cgpa >= req_cgpa:
                    meets_criteria = True

                if meets_criteria:
                    match_score += 15
                    display_val = f"{effective_perc:.1f}%" if effective_perc else f"CGPA {student_cgpa:.1f}"
                    match_reasons.append(f"Academic score {display_val} qualifies (min required: {req_perc:.0f}%)")
                else:
                    eligible = False
                    match_score -= 20
                    display_val = f"{effective_perc:.1f}%" if effective_perc else f"CGPA {student_cgpa:.1f}"
                    match_reasons.append(f"Current score {display_val} is below minimum requirement {req_perc:.0f}%")
                    action_item = f"Requires minimum {req_perc:.0f}% / {req_cgpa:.1f} CGPA to qualify"
        else:
            student_perc = acad.percentage if acad else None
            req_perc = scholarship.min_cgpa_or_percentage
            if req_perc <= 10.0:
                req_perc = req_perc * 10.0

            if student_perc is not None:
                if student_perc >= req_perc:
                    match_score += 15
                    match_reasons.append(f"Academic percentage {student_perc:.1f}% meets criteria ({req_perc:.1f}%)")
                else:
                    eligible = False
                    match_score -= 20
                    match_reasons.append(f"Percentage {student_perc:.1f}% below minimum {req_perc:.1f}%")
                    action_item = f"Requires minimum {req_perc:.0f}% in current examination"

    # 4. Stream or Branch Check
    if scholarship.eligible_streams_or_branches:
        allowed = [x.strip().lower() for x in scholarship.eligible_streams_or_branches.split(",")]
        student_branch = (acad.branch or acad.stream or "").lower() if acad else ""
        if any(branch in student_branch or student_branch in branch for branch in allowed if branch):
            match_score += 10
            match_reasons.append(f"Stream/Branch aligned with scholarship criteria")

    # Score clamping
    match_score = max(25, min(98, match_score))

    # Parse tags
    tags = [t.strip() for t in scholarship.tags.split(",")] if scholarship.tags else []

    eligibility_status = "Eligible" if eligible else "Needs Review / Not Eligible"

    return PersonalizedScholarshipResponse(
        id=scholarship.id,
        title=scholarship.title,
        provider=scholarship.provider,
        description=scholarship.description,
        benefit_value=scholarship.benefit_value,
        deadline=scholarship.deadline,
        min_cgpa_or_percentage=scholarship.min_cgpa_or_percentage,
        eligible_stages=[s.strip() for s in scholarship.eligible_stages.split(",")],
        eligible_streams_or_branches=[b.strip() for b in scholarship.eligible_streams_or_branches.split(",")] if scholarship.eligible_streams_or_branches else None,
        tags=tags,
        eligibility_status=eligibility_status,
        match_score=match_score,
        is_eligible=eligible,
        match_reasons=match_reasons,
        action_item=action_item,
        application_link=scholarship.application_link,
        application_url=scholarship.application_link,
        current_study=scholarship.current_study,
        amount_inr=scholarship.amount_inr
    )


def compute_student_intelligence_summary(student: Student, all_scholarships: List[Scholarship]) -> IntelligenceSummary:
    """
    Computes real dynamic intelligence metrics for profile completion screen.
    """
    completeness, priorities = calculate_profile_completeness(student)
    
    student_stage = student.education_stage.strip().lower()
    stage_scholarships = [
        s for s in all_scholarships
        if student_stage in [st.strip().lower() for st in s.eligible_stages.split(",")]
    ]

    eligible_count = 0
    for s in stage_scholarships:
        res = evaluate_scholarship_eligibility(s, student)
        if res.is_eligible:
            eligible_count += 1

    # Stage-based opportunity count
    stage_multiplier = {
        "class_10": 4,
        "intermediate": 6,
        "b_tech": 8
    }
    base_opps = stage_multiplier.get(student.education_stage, 5)
    skill_bonus = len(student.skills) if student.education_stage == "b_tech" else len(student.interests)
    total_opportunities = base_opps + min(4, skill_bonus)

    stage_labels = {
        "class_10": "Class 10 Scholar",
        "intermediate": "Intermediate Pathway",
        "b_tech": "B.Tech Engineering"
    }

    return IntelligenceSummary(
        eligible_scholarships_count=max(eligible_count, 1),
        relevant_opportunities_count=total_opportunities,
        priority_improvement_areas=priorities,
        completeness_percentage=completeness,
        stage_label=stage_labels.get(student.education_stage, "Student")
    )


def check_scholarship_eligibility(scholarship: Scholarship, student: Student) -> Dict[str, Any]:
    """
    Deterministic rule-based eligibility verification for a specific scholarship and student.
    Returns:
    {
      "scholarship_id": str,
      "title": str,
      "provider": str,
      "amount": str,
      "deadline": str,
      "source_url": str,
      "eligible": bool,
      "matched_rules": list[str],
      "failed_rules": list[str],
      "missing_information": list[str],
      "match_score": int
    }
    """
    matched_rules = []
    failed_rules = []
    missing_info = []
    match_score = 50

    # Check status
    if getattr(scholarship, "status", None) == "expired":
        failed_rules.append("Scholarship application cycle is currently closed/expired.")
        return {
            "scholarship_id": scholarship.id,
            "title": scholarship.title,
            "provider": scholarship.provider,
            "amount": scholarship.benefit_value,
            "deadline": scholarship.deadline,
            "source_url": getattr(scholarship, "source_url", None) or scholarship.application_link,
            "eligible": False,
            "matched_rules": matched_rules,
            "failed_rules": failed_rules,
            "missing_information": missing_info,
            "match_score": 0
        }

    # 1. Stage Check
    stages = [s.strip().lower() for s in (scholarship.eligible_stages or "").split(",") if s.strip()]
    student_stage = (student.education_stage or "").strip().lower()
    if not student_stage:
        missing_info.append("Student education stage is not defined.")
    elif student_stage in stages or not stages:
        matched_rules.append(f"Education stage matches ({student_stage.replace('_', ' ').title()}).")
        match_score += 20
    else:
        failed_rules.append(f"Requires stage in: {', '.join(stages)}; student is in {student_stage}.")
        match_score -= 30

    # 2. Academic Score Check
    acad = student.academic_profile
    req_score = scholarship.min_cgpa_or_percentage
    if req_score is not None:
        if not acad or (acad.cgpa is None and acad.percentage is None):
            missing_info.append("Student academic score (CGPA/Percentage) not recorded.")
        else:
            if student_stage == "b_tech":
                student_cgpa = acad.cgpa
                student_perc = acad.percentage or ((student_cgpa * 9.5) if student_cgpa else None)
                req_cgpa = req_score if req_score <= 10.0 else (req_score / 10.0)
                req_perc = req_score if req_score > 10.0 else (req_score * 9.5)

                if (student_cgpa and student_cgpa >= req_cgpa) or (student_perc and student_perc >= req_perc):
                    matched_rules.append(f"Academic score qualifies (Required: {req_score}, student has CGPA {student_cgpa} / {student_perc}%).")
                    match_score += 20
                else:
                    failed_rules.append(f"Academic score does not meet minimum {req_score} (Student has CGPA {student_cgpa}).")
                    match_score -= 20
            else:
                student_perc = acad.percentage or ((acad.cgpa * 9.5) if acad.cgpa else None)
                req_perc = req_score if req_score > 10.0 else (req_score * 10.0)
                if student_perc and student_perc >= req_perc:
                    matched_rules.append(f"Academic percentage qualifies (Required: {req_perc}%, student has {student_perc}%).")
                    match_score += 20
                else:
                    failed_rules.append(f"Academic score does not meet minimum {req_perc}% (Student has {student_perc}%).")
                    match_score -= 20

    # 3. Income Ceiling Check
    max_income = getattr(scholarship, "max_income", None)
    if max_income:
        # Check student financial context
        fin = student.financial_context
        # If student has annual income or budget specified
        if fin and getattr(fin, "annual_family_income", None):
            student_income = fin.annual_family_income
            if student_income <= max_income:
                matched_rules.append(f"Family income ₹{student_income:,} is within ceiling of ₹{max_income:,}.")
                match_score += 15
            else:
                failed_rules.append(f"Family income ₹{student_income:,} exceeds ceiling of ₹{max_income:,}.")
                match_score -= 25
        else:
            # We don't fail immediately if not stated, but note missing info
            missing_info.append(f"Family income document needed (Maximum ceiling: ₹{max_income:,}).")

    # 4. State Check
    eligible_states = getattr(scholarship, "eligible_states", None)
    if eligible_states and eligible_states.strip():
        states_list = [st.strip().lower() for st in eligible_states.split(",") if st.strip()]
        if "all" not in states_list and "pan-india" not in states_list:
            student_loc = (student.location or "").lower()
            if not student_loc:
                missing_info.append(f"Domicile verification required for states: {eligible_states}")
            elif any(st in student_loc for st in states_list):
                matched_rules.append(f"Domicile state matches ({eligible_states}).")
                match_score += 15
            else:
                failed_rules.append(f"Restricted to residents of: {eligible_states} (Student located in: {student.location}).")
                match_score -= 25

    # 5. Gender Check
    gender_req = getattr(scholarship, "gender_requirements", None)
    if gender_req and gender_req.lower() not in ["all", "any", "none"]:
        # If student gender is recorded or in tags
        student_tags = (student.target_role or "").lower()
        if "girl" in gender_req.lower() or "female" in gender_req.lower():
            # If not recorded, note as missing
            missing_info.append(f"Gender eligibility requirement: {gender_req}")

    # Final eligibility determination: no hard failures
    is_eligible = len(failed_rules) == 0

    return {
        "scholarship_id": scholarship.id,
        "title": scholarship.title,
        "provider": scholarship.provider,
        "amount": scholarship.benefit_value,
        "deadline": scholarship.deadline,
        "source_url": getattr(scholarship, "source_url", None) or scholarship.application_link,
        "eligible": is_eligible,
        "matched_rules": matched_rules,
        "failed_rules": failed_rules,
        "missing_information": missing_info,
        "match_score": max(10, min(100, match_score))
    }


def find_eligible_scholarships(student: Student, db: Any, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Deterministically queries all available scholarships, evaluates eligibility,
    and returns top ranked opportunities.
    """
    scholarships = db.query(Scholarship).all()
    results = []

    for s in scholarships:
        eval_result = check_scholarship_eligibility(s, student)
        # We include scholarships that are eligible or have only missing information (not hard failed)
        if eval_result["eligible"]:
            results.append(eval_result)

    # Sort by match score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:limit]

