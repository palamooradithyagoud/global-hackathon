from typing import List, Optional, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator
from datetime import datetime


# Enums & Allowed Literals
EducationStageType = Literal["class_10", "intermediate", "b_tech"]
SkillProficiencyType = Literal["Beginner", "Intermediate", "Advanced"]
LearningTimeType = Literal["Less than 1 hour/day", "1–2 hours/day", "2–4 hours/day", "4+ hours/day"]
IntermediateStreamType = Literal["MPC", "BiPC", "MEC", "CEC", "Other"]


# --- Sub-Schemas ---

class SkillBase(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=100)
    proficiency: SkillProficiencyType = "Intermediate"

    @field_validator("proficiency", mode="before")
    @classmethod
    def normalize_proficiency(cls, v: object) -> str:
        if isinstance(v, (int, float)) or (isinstance(v, str) and v.isdigit()):
            num = int(v)
            if num >= 4:
                return "Advanced"
            elif num >= 2:
                return "Intermediate"
            else:
                return "Beginner"
        if isinstance(v, str):
            v_lower = v.strip().lower()
            if "adv" in v_lower:
                return "Advanced"
            elif "beg" in v_lower:
                return "Beginner"
            elif "inter" in v_lower:
                return "Intermediate"
        return v if isinstance(v, str) else "Intermediate"


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: str
    student_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    technologies: Optional[str] = None
    github_url: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: str
    student_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CertificationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    issuer: Optional[str] = None
    date: Optional[str] = None
    credential_url: Optional[str] = None


class CertificationCreate(CertificationBase):
    pass


class CertificationResponse(CertificationBase):
    id: str
    student_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExperienceBase(BaseModel):
    type: str = Field(default="internship", max_length=50)  # internship, hackathon, achievement
    organization: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceResponse(ExperienceBase):
    id: str
    student_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AcademicProfileBase(BaseModel):
    school_or_college: Optional[str] = None
    board: Optional[str] = None
    university: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    stream: Optional[str] = None
    future_direction: Optional[str] = None


class AcademicProfileCreate(AcademicProfileBase):
    pass


class AcademicProfileResponse(AcademicProfileBase):
    id: str
    student_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PreferenceBase(BaseModel):
    preferred_location: Optional[str] = None
    available_learning_time: Optional[str] = None


class PreferenceCreate(PreferenceBase):
    pass


class PreferenceResponse(PreferenceBase):
    id: str
    student_id: str

    model_config = ConfigDict(from_attributes=True)


class FinancialContextBase(BaseModel):
    education_budget: Optional[str] = None
    certification_budget: Optional[str] = None


class FinancialContextCreate(FinancialContextBase):
    pass


class FinancialContextResponse(FinancialContextBase):
    id: str
    student_id: str

    model_config = ConfigDict(from_attributes=True)


# --- Complete Student Profile Schemas ---

class StudentProfileCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    date_of_birth: Optional[str] = None
    location: Optional[str] = None
    education_stage: EducationStageType
    target_role: Optional[str] = None

    # Child relational components
    academic_profile: AcademicProfileCreate
    skills: List[SkillCreate] = Field(default_factory=list)
    projects: List[ProjectCreate] = Field(default_factory=list)
    certifications: List[CertificationCreate] = Field(default_factory=list)
    experience: List[ExperienceCreate] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    preferences: Optional[PreferenceCreate] = None
    financial_context: Optional[FinancialContextCreate] = None

    @model_validator(mode="after")
    def validate_stage_specific_fields(self):
        stage = self.education_stage
        acad = self.academic_profile

        if stage == "b_tech":
            if not acad.branch:
                raise ValueError("Branch is required for B.Tech profile.")
            if not acad.year:
                raise ValueError("Year of study is required for B.Tech profile.")
            if acad.cgpa is None:
                raise ValueError("CGPA is required for B.Tech profile.")
            if acad.cgpa < 0.0 or acad.cgpa > 10.0:
                raise ValueError("CGPA must be between 0.0 and 10.0.")

        elif stage == "intermediate":
            if not acad.stream:
                raise ValueError("Stream (MPC, BiPC, etc.) is required for Intermediate profile.")
            if acad.percentage is not None and (acad.percentage < 0.0 or acad.percentage > 100.0):
                raise ValueError("Percentage must be between 0.0 and 100.0.")

        elif stage == "class_10":
            if not acad.school_or_college:
                raise ValueError("School name is required for Class 10 profile.")
            if acad.percentage is not None and (acad.percentage < 0.0 or acad.percentage > 100.0):
                raise ValueError("Percentage must be between 0.0 and 100.0.")

        return self


class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    target_role: Optional[str] = None
    education_stage: Optional[EducationStageType] = None
    academic_profile: Optional[AcademicProfileCreate] = None
    preferences: Optional[PreferenceCreate] = None
    financial_context: Optional[FinancialContextCreate] = None


class IntelligenceSummary(BaseModel):
    eligible_scholarships_count: int
    relevant_opportunities_count: int
    priority_improvement_areas: List[str]
    completeness_percentage: int
    stage_label: str


class StudentProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    date_of_birth: Optional[str] = None
    location: Optional[str] = None
    education_stage: EducationStageType
    target_role: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    academic_profile: Optional[AcademicProfileResponse] = None
    skills: List[SkillResponse] = Field(default_factory=list)
    projects: List[ProjectResponse] = Field(default_factory=list)
    certifications: List[CertificationResponse] = Field(default_factory=list)
    experience: List[ExperienceResponse] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    preferences: Optional[PreferenceResponse] = None
    financial_context: Optional[FinancialContextResponse] = None

    intelligence_summary: Optional[IntelligenceSummary] = None

    model_config = ConfigDict(from_attributes=True)


# --- Resume Extraction Schemas ---

class ExtractedProfileData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    education_stage: EducationStageType = "b_tech"
    degree: Optional[str] = None
    branch: Optional[str] = None
    college: Optional[str] = None
    graduation_year: Optional[str] = None
    cgpa: Optional[float] = None
    percentage: Optional[float] = None
    skills: List[SkillCreate] = Field(default_factory=list)
    projects: List[ProjectCreate] = Field(default_factory=list)
    certifications: List[CertificationCreate] = Field(default_factory=list)
    target_role: Optional[str] = None
    raw_text_length: int = 0
    extraction_confidence: str = "High"
    verification_notes: List[str] = Field(default_factory=list)


# --- Scholarship Schemas ---

class ScholarshipResponse(BaseModel):
    id: str
    title: str
    provider: str
    description: str
    benefit_value: str
    deadline: str
    min_cgpa_or_percentage: Optional[float] = None
    eligible_stages: List[str]
    eligible_streams_or_branches: Optional[List[str]] = None
    tags: List[str] = Field(default_factory=list)
    eligibility_status: str = "Eligibility not checked yet"
    application_link: Optional[str] = None
    application_url: Optional[str] = None
    current_study: Optional[str] = None
    amount_inr: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class PersonalizedScholarshipResponse(ScholarshipResponse):
    match_score: int
    is_eligible: bool
    match_reasons: List[str]
    action_item: Optional[str] = None


# --- Auth Schemas ---

class DemoAuthRequest(BaseModel):
    role: Optional[str] = "demo_student"
    education_stage: Optional[str] = "b_tech"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: Optional[str] = "password123"
    education_stage: EducationStageType = "b_tech"
    year: Optional[str] = "1st Year"  # e.g. "1st Year", "2nd Year", "3rd Year", "4th Year"
    branch_or_stream: Optional[str] = "Computer Science and Engineering"
    school_or_college: Optional[str] = "Engineering College"
    score: Optional[float] = 75.0
    location: Optional[str] = "Hyderabad, India"


class AuthResponse(BaseModel):
    token: str
    student_id: Optional[str] = None
    email: str
    name: str
    has_profile: bool
    education_stage: Optional[str] = None
