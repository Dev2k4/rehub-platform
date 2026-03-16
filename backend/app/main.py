from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.v1 import api_router
from app.core.config import settings

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For base template simplicity. In prod, use split list from settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Add health check for Docker
utils_router = APIRouter(prefix="/utils", tags=["Utils"])

@utils_router.get("/health-check/")
async def health_check():
    return {"status": "ok"}

app.include_router(utils_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to ReMarket API"}
