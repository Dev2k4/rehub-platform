"""Tests for listing CRUD operations."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import ListingStatus, ConditionGrade
from app.crud.crud_listing import (
    create_listing,
    get_listing,
    search_listings,
    update_listing,
    soft_delete_listing,
)
from app.schemas.listing import ListingCreate, ListingUpdate
from tests.utils import create_test_user, create_test_category, create_test_listing


@pytest.mark.asyncio
async def test_create_listing_success(db: AsyncSession):
    """Test creating a listing successfully."""
    seller = await create_test_user(db, email="seller@example.com")
    category = await create_test_category(db)
    await db.commit()
    
    create_data = ListingCreate(
        title="Used iPhone",
        category_id=category.id,
        price=500.00,
        condition_grade=ConditionGrade.LIKE_NEW,
        description="Excellent condition",
        is_negotiable=True,
    )
    
    listing = await create_listing(db, seller_id=seller.id, obj_in=create_data)
    
    assert listing is not None
    assert listing.title == "Used iPhone"
    assert listing.seller_id == seller.id
    assert listing.category_id == category.id
    assert listing.status == ListingStatus.PENDING  # New listings start as pending


@pytest.mark.asyncio
async def test_get_listing_success(db: AsyncSession):
    """Test retrieving a listing."""
    seller = await create_test_user(db, email="seller2@example.com")
    category = await create_test_category(db, name="phones", slug="phones")
    listing = await create_test_listing(
        db, seller=seller, category=category, title="Samsung Galaxy", price=400.00
    )
    await db.commit()
    
    result = await get_listing(db, listing_id=listing.id)
    
    assert result is not None
    assert result.id == listing.id
    assert result.title == "Samsung Galaxy"


@pytest.mark.asyncio
async def test_get_listing_not_found(db: AsyncSession):
    """Test retrieving non-existent listing."""
    import uuid
    fake_id = uuid.uuid4()
    
    result = await get_listing(db, listing_id=fake_id)
    
    assert result is None


@pytest.mark.asyncio
async def test_search_listings_pagination(db: AsyncSession):
    """Test searching listings with pagination."""
    seller = await create_test_user(db, email="seller3@example.com")
    category = await create_test_category(db, name="laptops", slug="laptops")
    
    # Create multiple listings
    for i in range(5):
        await create_test_listing(
            db,
            seller=seller,
            category=category,
            title=f"Laptop {i+1}",
            price=500 + (i * 100),
            status=ListingStatus.ACTIVE,
        )
    
    await db.commit()
    
    # Search with pagination
    results = await search_listings(
        db,
        skip=0,
        limit=3,
        category_id=category.id,
    )
    
    assert len(results) == 3


@pytest.mark.asyncio
async def test_search_listings_by_search_term(db: AsyncSession):
    """Test searching listings by title/description."""
    seller = await create_test_user(db, email="seller4@example.com")
    category = await create_test_category(db, name="books", slug="books")
    
    listing1 = await create_test_listing(
        db,
        seller=seller,
        category=category,
        title="Python Programming Book",
        status=ListingStatus.ACTIVE,
    )
    
    listing2 = await create_test_listing(
        db,
        seller=seller,
        category=category,
        title="JavaScript Book",
        status=ListingStatus.ACTIVE,
    )
    
    await db.commit()
    
    # Search for Python
    results = await search_listings(
        db,
        search="Python",
        skip=0,
        limit=10,
    )
    
    assert len(results) >= 1
    assert any(r.title == "Python Programming Book" for r in results)


@pytest.mark.asyncio
async def test_update_listing(db: AsyncSession):
    """Test updating a listing."""
    seller = await create_test_user(db, email="seller5@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    await db.commit()
    
    update_data = ListingUpdate(
        title="Updated Title",
        price=250.00,
        description="Updated description",
    )
    
    updated = await update_listing(db, listing_id=listing.id, obj_in=update_data)
    
    assert updated.title == "Updated Title"
    assert updated.price == 250.00


@pytest.mark.asyncio
async def test_soft_delete_listing(db: AsyncSession):
    """Test soft deleting a listing."""
    seller = await create_test_user(db, email="seller6@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    await db.commit()
    
    deleted = await soft_delete_listing(db, listing_id=listing.id)
    
    assert deleted.status == ListingStatus.HIDDEN


@pytest.mark.asyncio
async def test_api_create_listing_as_seller(client: AsyncClient, db: AsyncSession):
    """Test creating a listing via API as seller."""
    # Create and login user
    user = await create_test_user(db, email="seller_api@example.com")
    category = await create_test_category(db)
    await db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "seller_api@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    # Create listing
    response = await client.post(
        "/api/v1/listings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "API Created Listing",
            "category_id": str(category.id),
            "price": 150.00,
            "is_negotiable": True,
            "condition_grade": "like_new",
            "description": "Created via API",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "API Created Listing"
    assert data["status"] == "pending"  # Should be pending until approved


@pytest.mark.asyncio
async def test_api_update_own_listing(client: AsyncClient, db: AsyncSession):
    """Test updating own listing via API."""
    user = await create_test_user(db, email="update_seller@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=user, category=category)
    await db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "update_seller@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    response = await client.patch(
        f"/api/v1/listings/{listing.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Updated via API",
            "price": 200.00,
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated via API"
    assert data["price"] == 200.0


@pytest.mark.asyncio
async def test_api_get_listings_public(client: AsyncClient, db: AsyncSession):
    """Test getting public listings (for browsing)."""
    seller = await create_test_user(db, email="public_seller@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db,
        seller=seller,
        category=category,
        status=ListingStatus.ACTIVE,
    )
    await db.commit()
    
    response = await client.get("/api/v1/listings")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    # Only ACTIVE listings should show in public view
    assert any(item["id"] == str(listing.id) for item in data["items"])


@pytest.mark.asyncio
async def test_api_get_user_listings(client: AsyncClient, db: AsyncSession):
    """Test getting user's own listings."""
    user = await create_test_user(db, email="my_listings@example.com")
    category = await create_test_category(db)
    
    listing1 = await create_test_listing(
        db, seller=user, category=category, title="Listing 1"
    )
    listing2 = await create_test_listing(
        db, seller=user, category=category, title="Listing 2"
    )
    await db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "my_listings@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    response = await client.get(
        "/api/v1/listings/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_api_listing_detail_view(client: AsyncClient, db: AsyncSession):
    """Test viewing listing detail."""
    seller = await create_test_user(db, email="detail_seller@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(
        db,
        seller=seller,
        category=category,
        title="Detail View Test",
        status=ListingStatus.ACTIVE,
    )
    await db.commit()
    
    response = await client.get(f"/api/v1/listings/{listing.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Detail View Test"
    assert data["seller_id"] == str(seller.id)
