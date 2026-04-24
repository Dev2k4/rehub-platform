from pydantic import BaseModel, Field


class AiChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    context: dict[str, str] | None = None


class AiChatResponse(BaseModel):
    answer: str
    provider: str
    model: str
