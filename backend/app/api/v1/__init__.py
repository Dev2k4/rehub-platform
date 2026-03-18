from fastapi import APIRouter
from app.api.v1 import auth, users, admin, categories, listings, offers, orders, reviews, notifications

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(categories.router)
api_router.include_router(listings.router)
api_router.include_router(offers.router)
api_router.include_router(orders.router)
api_router.include_router(reviews.router)
api_router.include_router(notifications.router)
