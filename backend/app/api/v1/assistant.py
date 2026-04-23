import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.core.rate_limit import RateLimitError, enforce_rate_limit
from app.models.user import User
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    AssistantSuggestionsResponse,
)
from app.services.assistant_service import run_assistant_query

router = APIRouter(prefix="/assistant", tags=["Assistant"])
logger = logging.getLogger(__name__)


_SUGGESTION_MAP: dict[str, list[str]] = {
    "general": [
        "Toi muon tim iPhone gia tam 8 den 10 trieu",
        "Co laptop gaming gia khoang 15 trieu khong",
        "Nguoi dung x co uy tin khong",
    ],
    "listing_search": [
        "Tim dien thoai samsung gia khoang 6 trieu",
        "Co may anh cu gia tam 5 den 7 trieu khong",
        "Loc giup toi cac mon do like_new",
    ],
    "seller_reputation": [
        "Nguoi dung x co uy tin khong",
        "Danh gia cua seller x gan day nhu the nao",
        "Seller nao trust cao trong danh sach nay",
    ],
}


@router.get("/suggestions", response_model=AssistantSuggestionsResponse)
async def get_assistant_suggestions(
    context: str = Query("general", min_length=1, max_length=64),
    current_user: User = Depends(get_current_user),
):
    _ = current_user.id
    normalized = context.strip().lower()
    suggestions = _SUGGESTION_MAP.get(normalized, _SUGGESTION_MAP["general"])
    return AssistantSuggestionsResponse(context=normalized, suggestions=suggestions)


@router.post("/query", response_model=AssistantQueryResponse)
async def query_assistant(
    data: AssistantQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await enforce_rate_limit(
            "assistant:query",
            str(current_user.id),
            limit=40,
            window_seconds=60,
        )
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail=exc.message)

    start = time.perf_counter()
    result = await run_assistant_query(
        db=db,
        message=data.message,
        max_results=data.max_results,
    )
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "assistant_query user_id=%s intent=%s confidence=%.2f listings=%s duration_ms=%.2f",
        current_user.id,
        result.intent,
        result.confidence,
        len(result.listings),
        elapsed_ms,
    )
    return result
