import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)



def generate_uuid() -> str:
    return str(uuid.uuid4())


class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    date_of_birth = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    education_stage = Column(String(50), nullable=False, index=True)  # class_10, intermediate, b_tech
    target_role = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    # Relationships
    academic_profile = relationship("AcademicProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    projects = relationship("StudentProject", back_populates="student", cascade="all, delete-orphan")
    certifications = relationship("StudentCertification", back_populates="student", cascade="all, delete-orphan")
    experience = relationship("StudentExperience", back_populates="student", cascade="all, delete-orphan")
    interests = relationship("StudentInterest", back_populates="student", cascade="all, delete-orphan")
    preferences = relationship("StudentPreference", back_populates="student", uselist=False, cascade="all, delete-orphan")
    financial_context = relationship("StudentFinancialContext", back_populates="student", uselist=False, cascade="all, delete-orphan")


class AcademicProfile(Base):
    __tablename__ = "academic_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    school_or_college = Column(String(255), nullable=True)
    board = Column(String(100), nullable=True)
    university = Column(String(255), nullable=True)
    branch = Column(String(100), nullable=True)
    year = Column(String(50), nullable=True)
    percentage = Column(Float, nullable=True)
    cgpa = Column(Float, nullable=True)
    stream = Column(String(50), nullable=True)  # MPC, BiPC, MEC, CEC, etc.
    future_direction = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", back_populates="academic_profile")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    proficiency = Column(String(50), nullable=False)  # Beginner, Intermediate, Advanced
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", back_populates="skills")


class StudentProject(Base):
    __tablename__ = "student_projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(String(500), nullable=True)  # comma separated or JSON string
    github_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", back_populates="projects")


class StudentCertification(Base):
    __tablename__ = "student_certifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    issuer = Column(String(255), nullable=True)
    date = Column(String(50), nullable=True)
    credential_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", back_populates="certifications")


class StudentExperience(Base):
    __tablename__ = "student_experience"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # internship, hackathon, achievement
    organization = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", back_populates="experience")


class StudentInterest(Base):
    __tablename__ = "student_interests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    interest = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    student = relationship("Student", back_populates="interests")


class StudentPreference(Base):
    __tablename__ = "student_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    preferred_location = Column(String(255), nullable=True)
    available_learning_time = Column(String(100), nullable=True)  # <1 hour/day, 1–2 hours/day, 2–4 hours/day, 4+ hours/day
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", back_populates="preferences")


class StudentFinancialContext(Base):
    __tablename__ = "student_financial_context"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    education_budget = Column(String(100), nullable=True)
    certification_budget = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    student = relationship("Student", back_populates="financial_context")


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    benefit_value = Column(String(100), nullable=False)
    deadline = Column(String(100), nullable=False)
    eligible_stages = Column(String(255), nullable=False)  # comma separated: class_10,intermediate,b_tech
    min_cgpa_or_percentage = Column(Float, nullable=True)
    eligible_streams_or_branches = Column(String(500), nullable=True)
    tags = Column(String(255), nullable=True)
    application_link = Column(String(500), nullable=True)
    current_study = Column(String(100), nullable=True)
    amount_inr = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
