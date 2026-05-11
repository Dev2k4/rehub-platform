import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.enums import ListingStatus
from app.models.listing import Listing
from app.models.user import User

import uuid

async def create_user_and_login(client: AsyncClient, email: str):
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "Test User"}
    )
    res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "Password123!"}
    )
    return res.json()["access_token"]

@pytest.mark.asyncio
async def test_create_listing(client: AsyncClient, db: AsyncSession):
    # Setup user and category
    token = await create_user_and_login(client, "seller1@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    # We need an admin to create categories first
    await client.post("/api/v1/auth/register", json={"email": "admin@example.com", "password": "Password123!", "full_name": "Admin"})
    # Let's bypass realistic roles for test if it doesn't strictly check db role, or mock it.
    # To keep it simple, we assume there is a mock category
    cat_id = uuid.uuid4()
    db.add(Category(id=cat_id, name="Test Category", slug="test-category"))
    await db.commit()
    
    response = await client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "title": "My Awesome Laptop",
            "description": "Like new condition",
            "price": "500.00",
            "is_negotiable": True,
            "condition_grade": "like_new",
            "category_id": str(cat_id)
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_listings_advanced_search_filters_and_sort(client: AsyncClient, db: AsyncSession):
    token = await create_user_and_login(client, "seller-search@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    cat_id = uuid.uuid4()
    db.add(Category(id=cat_id, name="Electronics", slug="electronics"))
    await db.commit()

    # Create two listings with different prices/conditions for sorting and filtering assertions.
    low_resp = await client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "title": "Dien thoai cu gia tot",
            "description": "May hoat dong on dinh",
            "price": "200.00",
            "is_negotiable": True,
            "condition_grade": "good",
            "category_id": str(cat_id),
        },
    )
    high_resp = await client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "title": "Dien thoai moi dep",
            "description": "Gan nhu moi",
            "price": "500.00",
            "is_negotiable": True,
            "condition_grade": "like_new",
            "category_id": str(cat_id),
        },
    )

    assert low_resp.status_code == 201
    assert high_resp.status_code == 201

    # Promote listings to ACTIVE and set seller location for public search visibility.
    seller = (
        await db.execute(select(User).where(User.email == "seller-search@example.com"))
    ).scalar_one()
    seller.province = "Ha Noi"
    seller.district = "Cau Giay"

    listing_rows = (
        await db.execute(select(Listing).where(Listing.seller_id == seller.id))
    ).scalars().all()
    for row in listing_rows:
        row.status = ListingStatus.ACTIVE
    await db.commit()

    filtered_resp = await client.get(
        "/api/v1/listings",
        params={
            "keyword": "dien thoai",
            "condition_grade": "like_new",
            "province": "ha noi",
            "district": "cau giay",
            "sort_by": "price_desc",
        },
    )
    assert filtered_resp.status_code == 200
    filtered_data = filtered_resp.json()
    assert filtered_data["total"] == 1
    assert filtered_data["items"][0]["condition_grade"] == "like_new"

    sorted_resp = await client.get(
        "/api/v1/listings",
        params={
            "keyword": "dien thoai",
            "sort_by": "price_asc",
        },
    )
    assert sorted_resp.status_code == 200
    sorted_data = sorted_resp.json()
    assert sorted_data["total"] == 2
    prices = [float(item["price"]) for item in sorted_data["items"]]
    assert prices == sorted(prices)
