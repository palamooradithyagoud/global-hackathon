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
