import pytest
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.seeds.seed_data import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
