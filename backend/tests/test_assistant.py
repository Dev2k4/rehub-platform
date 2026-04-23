import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_listing import get_listing
from app.models.category import Category
from app.models.enums import ListingStatus


async def setup_users(client: AsyncClient) -> tuple[str, str, str]:
    buyer_email = f"assistant_buyer_{uuid.uuid4()}@example.com"
    seller_email = f"assistant_seller_{uuid.uuid4()}@example.com"

    buyer_register = await client.post(
        "/api/v1/auth/register",
        json={"email": buyer_email, "password": "Password123!", "full_name": "Assistant Buyer"},
    )
    assert buyer_register.status_code == 201, buyer_register.text

    seller_register = await client.post(
        "/api/v1/auth/register",
        json={"email": seller_email, "password": "Password123!", "full_name": "Assistant Seller"},
    )
    assert seller_register.status_code == 201, seller_register.text

    buyer_login = await client.post(
        "/api/v1/auth/login",
        data={"username": buyer_email, "password": "Password123!"},
    )
    assert buyer_login.status_code == 200, buyer_login.text

    seller_login = await client.post(
        "/api/v1/auth/login",
        data={"username": seller_email, "password": "Password123!"},
    )
    assert seller_login.status_code == 200, seller_login.text

    buyer_token = buyer_login.json()["access_token"]
    seller_token = seller_login.json()["access_token"]
    seller_id = seller_login.json()["user"]["id"]
    return buyer_token, seller_token, seller_id


async def create_active_listing(
    client: AsyncClient,
    db: AsyncSession,
    seller_headers: dict[str, str],
) -> str:
    category_id = uuid.uuid4()
    db.add(
        Category(
            id=category_id,
            name="Assistant Search Category",
            slug=f"assistant-search-{category_id.hex[:8]}",
        )
    )
    await db.commit()

    listing_response = await client.post(
        "/api/v1/listings/",
        headers=seller_headers,
        json={
            "title": "iPhone 12 64GB",
            "price": "10000000.00",
            "is_negotiable": True,
            "condition_grade": "good",
            "category_id": str(category_id),
        },
    )
    assert listing_response.status_code == 201, listing_response.text

    listing_id = listing_response.json()["id"]
    listing = await get_listing(db, uuid.UUID(listing_id))
    assert listing is not None
    listing.status = ListingStatus.ACTIVE
    db.add(listing)
    await db.commit()

    return listing_id


@pytest.mark.asyncio
async def test_assistant_query_returns_listing_candidates(client: AsyncClient, db: AsyncSession):
    buyer_token, seller_token, _ = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    _ = await create_active_listing(client, db, seller_headers)

    response = await client.post(
        "/api/v1/assistant/query",
        headers=buyer_headers,
        json={"message": "toi muon tim iphone gia tam 10 trieu", "max_results": 5},
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert payload["intent"] in {"listing_search", "listing_price_range"}
    assert isinstance(payload["answer"], str)
    assert len(payload["answer"]) > 0
    assert isinstance(payload["listings"], list)
    assert len(payload["listings"]) >= 1
    assert payload["listings"][0]["match_reason"]


@pytest.mark.asyncio
async def test_assistant_query_returns_seller_reputation(client: AsyncClient, db: AsyncSession):
    buyer_token, seller_token, seller_id = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    _ = await create_active_listing(client, db, seller_headers)

    response = await client.post(
        "/api/v1/assistant/query",
        headers=buyer_headers,
        json={"message": f"nguoi dung {seller_id} co uy tin khong"},
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert payload["intent"] == "seller_reputation"
    assert payload["seller_insight"] is not None
    assert payload["seller_insight"]["user_id"] == seller_id


@pytest.mark.asyncio
async def test_assistant_suggestions_endpoint(client: AsyncClient, db: AsyncSession):
    buyer_token, _, _ = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    response = await client.get(
        "/api/v1/assistant/suggestions?context=listing_search",
        headers=buyer_headers,
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["context"] == "listing_search"
    assert isinstance(payload["suggestions"], list)
    assert len(payload["suggestions"]) > 0
