from fastapi import APIRouter
from app.api.v1 import auth, users, admin, categories, listings

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(categories.router)
api_router.include_router(listings.router)
