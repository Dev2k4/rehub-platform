import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from app.core.config import settings
from app.services import ai_chat_service
from app.services.ai_price_service import get_price_suggestion_engine


@pytest.mark.asyncio
async def test_ai_chat_falls_back_without_provider(client: AsyncClient):
    previous_api_key = settings.AI_API_KEY
    previous_base_url = settings.AI_PROVIDER_BASE_URL
    previous_model = settings.AI_CHAT_MODEL
    previous_fallback = settings.AI_CHAT_FALLBACK_ENABLED

    settings.AI_API_KEY = ""
    settings.AI_PROVIDER_BASE_URL = ""
    settings.AI_CHAT_MODEL = ""
    settings.AI_CHAT_FALLBACK_ENABLED = True

    try:
        response = await client.post(
            "/api/v1/ai/chat",
            json={
                "message": "Cách đăng tin trên ReHub?",
                "context": {"pathname": "/listings/new"},
                "mode": "auto",
            },
        )
    finally:
        settings.AI_API_KEY = previous_api_key
        settings.AI_PROVIDER_BASE_URL = previous_base_url
        settings.AI_CHAT_MODEL = previous_model
        settings.AI_CHAT_FALLBACK_ENABLED = previous_fallback

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "local-fallback"
    assert payload["fallback_used"] is True
    assert "đăng tin" in payload["answer"].lower()


@pytest.mark.asyncio
async def test_ai_chat_falls_back_on_provider_quota_error(client: AsyncClient, monkeypatch):
    previous_api_key = settings.AI_API_KEY
    previous_base_url = settings.AI_PROVIDER_BASE_URL
    previous_model = settings.AI_CHAT_MODEL
    previous_fallback = settings.AI_CHAT_FALLBACK_ENABLED

    settings.AI_API_KEY = "test-key"
    settings.AI_PROVIDER_BASE_URL = "https://example.com/v1"
    settings.AI_CHAT_MODEL = "test-model"
    settings.AI_CHAT_FALLBACK_ENABLED = True

    async def raise_quota_error(*args, **kwargs):
        raise HTTPException(status_code=429, detail="quota exceeded")

    monkeypatch.setattr(ai_chat_service, "_ask_provider", raise_quota_error)

    try:
        response = await client.post(
            "/api/v1/ai/chat",
            json={
                "message": "Tôi muốn đăng tin đồ cũ",
                "context": {"pathname": "/listings/new"},
                "mode": "auto",
            },
        )
    finally:
        settings.AI_API_KEY = previous_api_key
        settings.AI_PROVIDER_BASE_URL = previous_base_url
        settings.AI_CHAT_MODEL = previous_model
        settings.AI_CHAT_FALLBACK_ENABLED = previous_fallback

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "local-fallback"
    assert payload["fallback_used"] is True
    assert "đăng tin" in payload["answer"].lower()


@pytest.mark.asyncio
async def test_price_suggestion_from_csv(client: AsyncClient, tmp_path):
    csv_path = tmp_path / "prices.csv"
    csv_path.write_text(
        "title,price,category,brand,condition\n"
        "iPhone 13 128GB,12500000,Phone,Apple,Like New\n"
        "iPhone 13 128GB,11800000,Phone,Apple,Good\n"
        "iPhone 13 128GB,13000000,Phone,Apple,Brand New\n"
        "iPhone 12 64GB,9000000,Phone,Apple,Good\n",
        encoding="utf-8",
    )

    previous_dataset = settings.AI_PRICE_DATASET_PATH
    settings.AI_PRICE_DATASET_PATH = str(csv_path)
    get_price_suggestion_engine.cache_clear()

    try:
        response = await client.post(
            "/api/v1/ai/price-suggestion",
            json={"query": "Tôi đang có iPhone 13 128GB cũ muốn bán"},
        )
    finally:
        settings.AI_PRICE_DATASET_PATH = previous_dataset
        get_price_suggestion_engine.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "local-price-index"
    assert payload["matched_count"] >= 1
    assert payload["suggested_price"] is not None
    assert payload["price_low"] is not None
    assert payload["price_high"] is not None
    assert payload["comparables"]
    assert "giá" in payload["summary"].lower()