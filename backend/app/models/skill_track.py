import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Index
from backend.app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class SkillTrack(Base):
    __tablename__ = "skill_tracks"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    student_id = Column(String(36), nullable=True, index=True)
    job_id = Column(String(255), nullable=False, index=True)
    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    salary = Column(String(255), nullable=True)
    apply_link = Column(String(1000), nullable=True)
    skills_i_have = Column(Text, nullable=True)  # JSON-encoded array of skills student has
    requirements = Column(Text, nullable=True)  # JSON-encoded requirements object
    what_to_learn = Column(Text, nullable=True)  # JSON-encoded what_to_learn object
    yt_playlist = Column(Text, nullable=True)  # Column storing JSON-encoded YouTube playlist info {topic: {playlist_id, title, channel_title, embed_url, thumbnail}}
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    __table_args__ = (
        Index("idx_skilltrack_student_job", "student_id", "job_id"),
    )
