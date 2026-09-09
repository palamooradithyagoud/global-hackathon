from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.cache import cache
from backend.app.api.v1.router import api_router
from backend.app.seeds.seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables and seed data exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        # Pre-warm connection pool and in-memory cache for zero cold-start delay
        cache.warm_up(db)
    finally:
        db.close()

    yield

    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SkillCatalyst Phase 1.1 Backend: Student Onboarding & Intelligence Profile API",
    version="1.1.0",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend communication (supports local dev and all Vercel deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
