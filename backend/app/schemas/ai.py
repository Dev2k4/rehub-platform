from typing import Literal

from pydantic import BaseModel, Field


class AiChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    context: dict[str, str] | None = None
    mode: Literal["auto", "chat", "price"] = "auto"


class AiProductItem(BaseModel):
    """A product found in the database matching the user's query."""

    listing_id: str
    title: str
    price: int
    condition: str
    condition_label: str
    category_name: str | None = None
    image_url: str | None = None


class AiChatResponse(BaseModel):
    answer: str
    provider: str
    model: str
    intent: str = "assistant"
    fallback_used: bool = False
    products: list[AiProductItem] | None = None


class AiPriceSuggestionRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    context: dict[str, str] | None = None


class AiPriceComparable(BaseModel):
    title: str
    price: int
    category: str | None = None
    brand: str | None = None
    condition: str | None = None
    score: float


class AiPriceSuggestionResponse(BaseModel):
    query: str
    suggested_price: int | None
    price_low: int | None
    price_high: int | None
    confidence: float
    matched_count: int
    provider: str
    model: str
    comparables: list[AiPriceComparable]
    summary: str
