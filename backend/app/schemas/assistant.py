import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class AssistantQueryRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1000)
    max_results: int = Field(default=5, ge=1, le=10)


class AssistantListingCandidate(BaseModel):
    id: uuid.UUID
    title: str
    price: Decimal
    condition_grade: str
    status: str
    seller_id: uuid.UUID
    seller_name: str | None = None
    province: str | None = None
    district: str | None = None
    trust_score: float
    rating_avg: float
    rating_count: int
    completed_orders: int
    image_url: str | None = None
    match_reason: str | None = None


class AssistantSellerInsight(BaseModel):
    user_id: uuid.UUID
    full_name: str
    trust_score: float
    rating_avg: float
    rating_count: int
    completed_orders: int
    review_summary: list[str] = Field(default_factory=list)


class AssistantQueryResponse(BaseModel):
    answer: str
    intent: str
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    listings: list[AssistantListingCandidate] = Field(default_factory=list)
    seller_insight: AssistantSellerInsight | None = None
    follow_up_questions: list[str] = Field(default_factory=list)


class AssistantSuggestionsResponse(BaseModel):
    context: str = "general"
    suggestions: list[str] = Field(default_factory=list)
