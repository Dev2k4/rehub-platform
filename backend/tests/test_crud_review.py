"""Tests for review CRUD operations."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import ListingStatus, OrderStatus
from app.crud.crud_review import (
    get_review_by_order,
    create_review,
    get_user_reviews,
)
from app.schemas.review import ReviewCreate
from tests.utils import (
    create_test_user,
    create_test_category,
    create_test_listing,
    create_test_order,
    create_test_review,
)


@pytest.mark.asyncio
async def test_create_review_success(db: AsyncSession):
    """Test creating a review for a completed order."""
    seller = await create_test_user(db, email="seller@example.com")
    buyer = await create_test_user(db, email="buyer@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    order = await create_test_order(
        db,
        listing=listing,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    await db.commit()
    
    create_data = ReviewCreate(
        order_id=order.id,
        rating=5,
        comment="Excellent product and seller!",
    )
    
    review = await create_review(db, reviewer_id=buyer.id, obj_in=create_data)
    
    assert review is not None
    assert review.reviewer_id == buyer.id
    assert review.order_id == order.id
    assert review.rating == 5
    assert review.comment == "Excellent product and seller!"


@pytest.mark.asyncio
async def test_get_review_by_order(db: AsyncSession):
    """Test retrieving review by order ID."""
    seller = await create_test_user(db, email="seller2@example.com")
    buyer = await create_test_user(db, email="buyer2@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    order = await create_test_order(
        db,
        listing=listing,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    review = await create_test_review(
        db, order=order, reviewer=buyer, rating=4, comment="Good"
    )
    
    await db.commit()
    
    result = await get_review_by_order(db, order_id=order.id)
    
    assert result is not None
    assert result.id == review.id


@pytest.mark.asyncio
async def test_get_user_reviews(db: AsyncSession):
    """Test retrieving reviews for a user."""
    seller = await create_test_user(db, email="seller3@example.com")
    buyer = await create_test_user(db, email="buyer3@example.com")
    category = await create_test_category(db)
    
    listing1 = await create_test_listing(db, seller=seller, category=category)
    listing2 = await create_test_listing(db, seller=seller, category=category)
    
    order1 = await create_test_order(
        db,
        listing=listing1,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    order2 = await create_test_order(
        db,
        listing=listing2,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    
    await create_test_review(db, order=order1, reviewer=buyer, rating=5)
    await create_test_review(db, order=order2, reviewer=buyer, rating=4)
    
    await db.commit()
    
    reviews = await get_user_reviews(db, user_id=seller.id)
    
    assert len(reviews) >= 2


@pytest.mark.asyncio
async def test_review_updates_seller_ratings(db: AsyncSession):
    """Test that creating reviews updates seller's average rating."""
    seller = await create_test_user(db, email="seller4@example.com")
    buyer1 = await create_test_user(db, email="buyer4@example.com")
    buyer2 = await create_test_user(db, email="buyer5@example.com")
    category = await create_test_category(db)
    
    listing1 = await create_test_listing(db, seller=seller, category=category)
    listing2 = await create_test_listing(db, seller=seller, category=category)
    
    order1 = await create_test_order(
        db,
        listing=listing1,
        buyer=buyer1,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    order2 = await create_test_order(
        db,
        listing=listing2,
        buyer=buyer2,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    
    await db.commit()
    
    # Create reviews
    await create_test_review(db, order=order1, reviewer=buyer1, rating=5)
    await create_test_review(db, order=order2, reviewer=buyer2, rating=4)
    
    await db.commit()
    
    # Refresh seller to see updated ratings
    await db.refresh(seller)
    
    # Average of 5 and 4 = 4.5
    assert seller.rating_count == 2
    assert seller.rating_avg >= 4.0


@pytest.mark.asyncio
async def test_api_create_review(client: AsyncClient, db: AsyncSession):
    """Test creating a review via API."""
    seller = await create_test_user(db, email="api_seller@example.com")
    buyer = await create_test_user(db, email="api_buyer@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    order = await create_test_order(
        db,
        listing=listing,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    
    await db.commit()
    
    buyer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "api_buyer@example.com",
            "password": "TestPassword123",
        },
    )
    token = buyer_login.json()["access_token"]
    
    response = await client.post(
        "/api/v1/reviews",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "order_id": str(order.id),
            "rating": 5,
            "comment": "Perfect transaction!",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 5
    assert data["comment"] == "Perfect transaction!"


@pytest.mark.asyncio
async def test_api_get_user_reviews(client: AsyncClient, db: AsyncSession):
    """Test retrieving user reviews via API."""
    seller = await create_test_user(db, email="api_seller2@example.com")
    buyer = await create_test_user(db, email="api_buyer2@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    order = await create_test_order(
        db,
        listing=listing,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    await create_test_review(db, order=order, reviewer=buyer, rating=4)
    
    await db.commit()
    
    response = await client.get(f"/api/v1/reviews/user/{seller.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_api_get_review_for_order(client: AsyncClient, db: AsyncSession):
    """Test retrieving review for specific order via API."""
    seller = await create_test_user(db, email="api_seller3@example.com")
    buyer = await create_test_user(db, email="api_buyer3@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    order = await create_test_order(
        db,
        listing=listing,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.COMPLETED,
    )
    review = await create_test_review(
        db, order=order, reviewer=buyer, rating=3, comment="Average product"
    )
    
    await db.commit()
    
    response = await client.get(f"/api/v1/reviews/order/{order.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["rating"] == 3
    assert data["comment"] == "Average product"


@pytest.mark.asyncio
async def test_cannot_review_uncompleted_order(client: AsyncClient, db: AsyncSession):
    """Test that reviews cannot be created for non-completed orders."""
    seller = await create_test_user(db, email="seller_pending@example.com")
    buyer = await create_test_user(db, email="buyer_pending@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    # Order is PENDING, not COMPLETED
    order = await create_test_order(
        db,
        listing=listing,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.PENDING,
    )
    
    await db.commit()
    
    buyer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "buyer_pending@example.com",
            "password": "TestPassword123",
        },
    )
    token = buyer_login.json()["access_token"]
    
    response = await client.post(
        "/api/v1/reviews",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "order_id": str(order.id),
            "rating": 5,
            "comment": "Cannot review pending order",
        },
    )
    
    # Should fail because order is not completed
    assert response.status_code in [400, 409]
