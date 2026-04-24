from fastapi import APIRouter

from app.core.config import settings
from app.schemas.ai import AiChatRequest, AiChatResponse
from app.services.ai_chat_service import generate_ai_answer

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=AiChatResponse)
async def ai_chat(payload: AiChatRequest) -> AiChatResponse:
    answer = await generate_ai_answer(payload.message, payload.context)
    return AiChatResponse(
        answer=answer,
        provider=settings.AI_PROVIDER_NAME,
        model=settings.AI_CHAT_MODEL,
    )
