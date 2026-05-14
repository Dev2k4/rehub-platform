from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.core.config import settings
from app.schemas.ai import (
    AiChatRequest,
    AiChatResponse,
    AiPriceSuggestionRequest,
    AiProductItem,
)
from app.services.ai_chat_service import generate_ai_answer
from app.services.ai_price_service import (
    PriceDatasetUnavailableError,
    PriceSuggestionProviderError,
    get_price_suggestion_engine,
    suggest_price_with_ai,
)

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=AiChatResponse)
async def ai_chat(payload: AiChatRequest, db: AsyncSession = Depends(get_db)) -> AiChatResponse:
    result = await generate_ai_answer(
        payload.message, payload.context, mode=payload.mode, db=db, session_id=payload.session_id
    )
    products = None
    if result.products:
        products = [AiProductItem(**p) for p in result.products]
    return AiChatResponse(
        answer=result.answer,
        provider=result.provider,
        model=result.model,
        intent=result.intent,
        fallback_used=result.fallback_used,
        products=products,
    )


@router.post("/price-suggestion", response_model=int)
async def ai_price_suggestion(payload: AiPriceSuggestionRequest) -> int:
    engine = get_price_suggestion_engine()
    provider_name = engine.provider_name
    model_name = engine.model_name
    try:
        suggestion = engine.suggest(payload.query, payload.context, session_id=payload.session_id)
    except PriceDatasetUnavailableError as exc:
        try:
            suggestion = await suggest_price_with_ai(payload.query, payload.context, session_id=payload.session_id)
            provider_name = settings.AI_PROVIDER_NAME or "ai"
            model_name = settings.AI_CHAT_MODEL or "unknown"
        except PriceSuggestionProviderError as provider_exc:
            raise HTTPException(status_code=503, detail=str(provider_exc)) from provider_exc

    suggested_price = suggestion.suggested_price
    if suggested_price is None:
        raise HTTPException(status_code=503, detail="Khong the goi y gia")

    return int(suggested_price)
