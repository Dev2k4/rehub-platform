import asyncio
import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import APIRouter, FastAPI, Header, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from minio import Minio
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.api.v1 import api_router
from app.core.cache import cache
from app.core.config import get_cors_origins, settings
from app.crud import crud_offer
from app.db.init_db import init_db
from app.db.session import AsyncSessionLocal
from app.services.websocket_manager import connection_manager

logger = logging.getLogger(__name__)
offer_expiry_task: asyncio.Task | None = None

limiter = Limiter(key_func=get_remote_address)

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        release=settings.SENTRY_RELEASE or None,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        integrations=[FastApiIntegration()],
    )


def _create_minio_client() -> Minio:
    endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
    return Minio(
        endpoint,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


async def _check_database() -> tuple[bool, str]:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True, "ok"
    except Exception as exc:
        logger.exception("Database readiness check failed")
        return False, str(exc)


async def _check_redis() -> tuple[bool, str]:
    try:
        if not cache.is_available:
            return False, "redis disabled"
        if not cache.is_connected:
            await cache.connect()
        if not cache.is_connected:
            return False, "redis unavailable"
        # Accessing protected member here is intentional to issue a direct ping.
        await cache._client.ping()  # type: ignore[attr-defined]
        return True, "ok"
    except Exception as exc:
        logger.exception("Redis readiness check failed")
        return False, str(exc)


async def _check_minio() -> tuple[bool, str]:
    try:
        if settings.STORAGE_BACKEND.lower() != "minio":
            return True, "storage backend is local"

        client = _create_minio_client()
        if not client.bucket_exists(settings.MINIO_BUCKET_NAME):
            return False, f"listing bucket '{settings.MINIO_BUCKET_NAME}' not found"
        if not client.bucket_exists(settings.CHAT_MINIO_BUCKET_NAME):
            return False, f"chat bucket '{settings.CHAT_MINIO_BUCKET_NAME}' not found"
        return True, "ok"
    except Exception as exc:
        logger.exception("MinIO readiness check failed")
        return False, str(exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await cache.connect()
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

    try:
        yield
    finally:
        if offer_expiry_task:
            offer_expiry_task.cancel()
            try:
                await offer_expiry_task
            except asyncio.CancelledError:
                pass
        await cache.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins = get_cors_origins()

# Set CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Add health check for Docker
utils_router = APIRouter(prefix="/utils", tags=["Utils"])

@utils_router.get("/health-check/")
async def health_check():
    return {"status": "ok"}


@utils_router.get("/health-readiness/")
async def health_readiness() -> JSONResponse:
    db_ok, db_message = await _check_database()
    redis_ok, redis_message = await _check_redis()
    minio_ok, minio_message = await _check_minio()

    checks = {
        "database": {"ok": db_ok, "message": db_message},
        "redis": {"ok": redis_ok, "message": redis_message},
        "minio": {"ok": minio_ok, "message": minio_message},
    }
    all_ok = all(item["ok"] for item in checks.values())
    payload = {
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
    }
    return JSONResponse(status_code=200 if all_ok else 503, content=payload)


@utils_router.post("/sentry-test/")
async def sentry_test(x_sentry_test_token: str | None = Header(default=None)) -> dict[str, str]:
    if not settings.SENTRY_DSN:
        raise HTTPException(status_code=400, detail="Sentry is not configured")

    if not settings.SENTRY_TEST_TOKEN or x_sentry_test_token != settings.SENTRY_TEST_TOKEN:
        raise HTTPException(status_code=404, detail="Not found")

    try:
        raise RuntimeError("Sentry test event from /api/v1/utils/sentry-test/")
    except RuntimeError as exc:
        event_id = sentry_sdk.capture_exception(exc)
        return {"status": "sent", "event_id": str(event_id)}

app.include_router(utils_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to ReMarket API"}
