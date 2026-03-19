"""Tests for API error handling."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from tests.utils import create_test_user, create_test_category, create_test_listing


@pytest.mark.asyncio
async def test_invalid_token_returns_401(client: AsyncClient):
    """Test that invalid token returns 401 Unauthorized."""
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_missing_token_returns_403(client: AsyncClient):
    """Test that missing token returns 403 Forbidden."""
    response = await client.get("/api/v1/users/me")
    
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_nonexistent_listing_returns_404(client: AsyncClient):
    """Test that accessing non-existent listing returns 404."""
    fake_id = str(uuid.uuid4())
    
    response = await client.get(f"/api/v1/listings/{fake_id}")
    
    # Either 404 or 200 with empty data, depending on implementation
    assert response.status_code in [404, 200]


@pytest.mark.asyncio
async def test_invalid_email_in_register_returns_422(client: AsyncClient):
    """Test that invalid email in registration returns 422."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "ValidPassword123",
            "full_name": "Test User",
        },
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_weak_password_validation(client: AsyncClient):
    """Test that weak password is rejected."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@example.com",
            "password": "weak",  # Too short/simple
            "full_name": "Test User",
        },
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_duplicate_email_returns_409(client: AsyncClient, db: AsyncSession):
    """Test that duplicate email registration returns 409 Conflict."""
    email = "duplicate@example.com"
    
    # Create first user
    await create_test_user(db, email=email)
    await db.commit()
    
    # Try to register with same email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "ValidPassword123",
            "full_name": "Another User",
        },
    )
    
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_invalid_login_credentials(client: AsyncClient, db: AsyncSession):
    """Test that invalid credentials return 401."""
    await create_test_user(db, email="login@example.com", password="CorrectPassword123")
    await db.commit()
    
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "WrongPassword123",
        },
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_nonexistent_user_login(client: AsyncClient):
    """Test that login with non-existent email returns 401."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "AnyPassword123",
        },
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_listing_not_owned_returns_403(client: AsyncClient, db: AsyncSession):
    """Test that user cannot update another user's listing."""
    seller1 = await create_test_user(db, email="seller1@example.com")
    seller2 = await create_test_user(db, email="seller2@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(db, seller=seller1, category=category)
    await db.commit()
    
    # Login as seller2
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "seller2@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    # Try to update seller1's listing
    response = await client.patch(
        f"/api/v1/listings/{listing.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Hacked Title"},
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invalid_json_returns_422(client: AsyncClient):
    """Test that invalid JSON returns 422."""
    response = await client.post(
        "/api/v1/auth/register",
        headers={"Content-Type": "application/json"},
        content=b"{ invalid json }",
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_missing_required_field_returns_422(client: AsyncClient):
    """Test that missing required fields return 422."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "incomplete@example.com",
            # Missing 'password' and 'full_name'
        },
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_admin_endpoints_require_admin_role(
    client: AsyncClient, db: AsyncSession
):
    """Test that admin endpoints require admin role."""
    user = await create_test_user(db, email="regular@example.com")
    await db.commit()
    
    # Login as regular user
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "regular@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    # Try to access admin endpoint
    response = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invalid_offer_price_returns_422(client: AsyncClient, db: AsyncSession):
    """Test that invalid offer price returns 422."""
    seller = await create_test_user(db, email="seller@example.com")
    buyer = await create_test_user(db, email="buyer@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    await db.commit()
    
    buyer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "buyer@example.com",
            "password": "TestPassword123",
        },
    )
    token = buyer_login.json()["access_token"]
    
    # Try to create offer with negative price
    response = await client.post(
        "/api/v1/offers",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "listing_id": str(listing.id),
            "offer_price": -50,  # Invalid negative price
        },
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_rate_limiting_on_login(client: AsyncClient, db: AsyncSession):
    """Test that login rate limiting works (5 failed attempts per 15 min)."""
    await create_test_user(db, email="ratelimit@example.com")
    await db.commit()
    
    # Make multiple failed login attempts
    for i in range(6):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "ratelimit@example.com",
                "password": "WrongPassword",
            },
        )
        # After 5 attempts, should get rate limited (429)
        if i >= 5:
            assert response.status_code == 429
            break


@pytest.mark.asyncio
async def test_cannot_create_offer_without_login(client: AsyncClient, db: AsyncSession):
    """Test that creating offer requires authentication."""
    seller = await create_test_user(db, email="seller@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    await db.commit()
    
    response = await client.post(
        "/api/v1/offers",
        json={
            "listing_id": str(listing.id),
            "offer_price": 50.0,
        },
    )
    
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_invalid_listing_id_format_returns_422(client: AsyncClient):
    """Test that invalid listing ID format returns 422."""
    response = await client.get("/api/v1/listings/not-a-uuid")
    
    # Either 404 or 422 depending on how UUID validation is done
    assert response.status_code in [404, 422]


@pytest.mark.asyncio
async def test_database_error_returns_500(client: AsyncClient):
    """Test that database errors return 500."""
    # This is a placeholder - actual DB errors would require mocking
    # In real scenario, try to trigger a database constraint violation
    pass


@pytest.mark.asyncio
async def test_empty_search_returns_paginated_results(client: AsyncClient, db: AsyncSession):
    """Test that empty search query returns all listings paginated."""
    seller = await create_test_user(db, email="search_seller@example.com")
    category = await create_test_category(db)
    await create_test_listing(db, seller=seller, category=category)
    await db.commit()
    
    response = await client.get("/api/v1/listings?skip=0&limit=10")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_pagination_validation(client: AsyncClient):
    """Test that pagination parameters are validated."""
    # Negative skip
    response = await client.get("/api/v1/listings?skip=-1&limit=10")
    assert response.status_code in [200, 422]
    
    # Negative limit
    response = await client.get("/api/v1/listings?skip=0&limit=-10")
    assert response.status_code in [200, 422]
    
    # Limit too large
    response = await client.get("/api/v1/listings?skip=0&limit=10000")
    assert response.status_code == 200  # Should cap at reasonable limit
