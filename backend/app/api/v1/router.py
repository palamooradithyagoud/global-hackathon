from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, scholarships, profile, resume

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(scholarships.router)
api_router.include_router(profile.router)
api_router.include_router(resume.router)
