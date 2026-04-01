import asyncio
import logging

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.v1 import api_router
from app.core.config import settings
from app.crud import crud_offer
from app.db.init_db import init_db
from app.db.session import AsyncSessionLocal
from app.services.websocket_manager import connection_manager

logger = logging.getLogger(__name__)
offer_expiry_task: asyncio.Task | None = None

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


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()

    async def _offer_expiry_worker() -> None:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    expired_offers = await crud_offer.expire_stale_offers(session)
                    if expired_offers:
                        logger.info("Expired %s stale offers", len(expired_offers))
                        for item in expired_offers:
                            event = {
                                "type": "offer:expired",
                                "data": {
                                    "offer_id": str(item["offer_id"]),
                                    "listing_id": str(item["listing_id"]),
                                    "status": "expired",
                                },
                            }
                            try:
                                await connection_manager.send_to_user(item["buyer_id"], event)
                                if item["seller_id"] != item["buyer_id"]:
                                    await connection_manager.send_to_user(item["seller_id"], event)
                            except Exception:
                                logger.exception(
                                    "Failed to broadcast offer:expired for offer %s",
                                    item["offer_id"],
                                )
            except Exception:
                logger.exception("Offer expiry worker failed")

            await asyncio.sleep(settings.OFFER_EXPIRY_JOB_INTERVAL_MINUTES * 60)

    global offer_expiry_task
    offer_expiry_task = asyncio.create_task(_offer_expiry_worker())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    global offer_expiry_task
    if offer_expiry_task:
        offer_expiry_task.cancel()
        try:
            await offer_expiry_task
        except asyncio.CancelledError:
            pass

@app.get("/")
def root():
    return {"message": "Welcome to ReMarket API"}
