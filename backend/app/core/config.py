from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os


from dotenv import load_dotenv

# Preload .env from possible locations (root, backend, frontend)
for _env_path in [".env", "backend/.env", "frontend/.env", "../backend/.env", "../frontend/.env", "../.env"]:
    if os.path.exists(_env_path):
        load_dotenv(_env_path, override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillCatalyst Intelligence API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Supabase PostgreSQL or SQLite fallback for immediate local testing
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./skillcatalyst.db")
    
    # External AI and Job APIs
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openrouter/free")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    JOOBLE_API_KEY: str = os.getenv("JOOBLE_API_KEY", "")
    JOOBLE_API_URL: str = os.getenv("JOOBLE_API_URL", "https://jooble.org/api")

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
            if "db.hvsxhkrjnjfmhkvujjyn.supabase.co" in v:
                v = v.replace("db.hvsxhkrjnjfmhkvujjyn.supabase.co", "aws-0-ap-southeast-2.pooler.supabase.com")
                if "://postgres:" in v:
                    v = v.replace("://postgres:", "://postgres.hvsxhkrjnjfmhkvujjyn:")
                if "adithyagoud@789" in v:
                    v = v.replace("adithyagoud@789", "adithyagoud%40789")
        return v or "sqlite:///./skillcatalyst.db"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "frontend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
