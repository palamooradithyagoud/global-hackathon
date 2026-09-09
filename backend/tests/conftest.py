import pytest
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.seeds.migrate_db import apply_migrations
from backend.app.seeds.seed_data import seed_database
from backend.app.seeds.agent_seed_data import seed_agent_data


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    apply_migrations()
    db = SessionLocal()
    try:
        seed_database(db)
        seed_agent_data(db)
    finally:
        db.close()
    yield

