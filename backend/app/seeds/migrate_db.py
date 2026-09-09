import logging
from sqlalchemy import text
from backend.app.core.database import engine

logger = logging.getLogger(__name__)


def apply_migrations():
    """
    Applies backward-compatible schema alterations to existing production/local tables.
    Runs idempotently for both PostgreSQL (Supabase) and SQLite.
    """
    is_postgres = "postgres" in engine.dialect.name

    columns_to_add = [
        ("max_income", "FLOAT" if not is_postgres else "DOUBLE PRECISION"),
        ("eligible_states", "VARCHAR(255)"),
        ("eligible_categories", "VARCHAR(255)"),
        ("gender_requirements", "VARCHAR(50)"),
        ("source_url", "VARCHAR(500)"),
        ("required_documents", "TEXT"),
        ("last_verified", "VARCHAR(50)"),
        ("status", "VARCHAR(50) DEFAULT 'verified'"),
    ]

    with engine.connect() as conn:
        for col_name, col_type in columns_to_add:
            try:
                if is_postgres:
                    conn.execute(text(f"ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                else:
                    # SQLite does not support IF NOT EXISTS in ADD COLUMN
                    conn.execute(text(f"ALTER TABLE scholarships ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                logger.info(f"Ensured column 'scholarships.{col_name}' exists.")
            except Exception:
                # Column already exists
                pass
