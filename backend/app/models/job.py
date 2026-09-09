import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, Index
from backend.app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    external_id = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=False, default="India", index=True)
    description = Column(Text, nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    salary_raw = Column(String(255), nullable=True)
    employment_type = Column(String(100), nullable=True, default="Full-time")
    experience_required = Column(String(100), nullable=True)
    source = Column(String(50), default="jooble", index=True)
    source_url = Column(String(1000), nullable=True)
    required_skills_json = Column(Text, nullable=True)  # JSON-encoded extracted normalized skills
    posted_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    __table_args__ = (
        Index("idx_job_title_location", "title", "location"),
        Index("idx_job_source_posted", "source", "posted_at"),
    )
