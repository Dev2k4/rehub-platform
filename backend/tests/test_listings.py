import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import ListingStatus

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
    import uuid
    from app.models.category import Category
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
