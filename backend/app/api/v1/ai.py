from fastapi import APIRouter, HTTPException

from app.schemas.ai import (
    AiChatRequest,
    AiChatResponse,
    AiPriceComparable,
    AiPriceSuggestionRequest,
    AiPriceSuggestionResponse,
)
from app.services.ai_chat_service import generate_ai_answer
from app.services.ai_price_service import PriceDatasetUnavailableError, get_price_suggestion_engine

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=AiChatResponse)
async def ai_chat(payload: AiChatRequest) -> AiChatResponse:
    result = await generate_ai_answer(payload.message, payload.context, mode=payload.mode)
    return AiChatResponse(
        answer=result.answer,
        provider=result.provider,
        model=result.model,
        intent=result.intent,
        fallback_used=result.fallback_used,
    )


@router.post("/price-suggestion", response_model=AiPriceSuggestionResponse)
async def ai_price_suggestion(payload: AiPriceSuggestionRequest) -> AiPriceSuggestionResponse:
    engine = get_price_suggestion_engine()
    try:
        suggestion = engine.suggest(payload.query, payload.context)
    except PriceDatasetUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return AiPriceSuggestionResponse(
        query=suggestion.query,
        suggested_price=suggestion.suggested_price,
        price_low=suggestion.price_low,
        price_high=suggestion.price_high,
        confidence=suggestion.confidence,
        matched_count=suggestion.matched_count,
        provider=engine.provider_name,
        model=engine.model_name,
        comparables=[
            AiPriceComparable(
                title=item.title,
                price=item.price,
                category=item.category,
                brand=item.brand,
                condition=item.condition,
                score=item.score,
            )
            for item in suggestion.comparables
        ],
        summary=suggestion.summary,
    )
