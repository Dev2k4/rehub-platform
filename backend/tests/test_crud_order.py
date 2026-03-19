"""Tests for order CRUD operations."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import ListingStatus, OfferStatus, OrderStatus
from app.crud.crud_order import (
    get_user_orders,
    create_direct_order,
    get_order_by_id,
    complete_order,
    cancel_order,
)
from app.schemas.order import OrderCreate
from tests.utils import (
    create_test_user,
    create_test_category,
    create_test_listing,
    create_test_offer,
    create_test_order,
)


@pytest.mark.asyncio
async def test_create_direct_order_success(db: AsyncSession):
    """Test creating a direct order (direct purchase)."""
    seller = await create_test_user(db, email="seller@example.com")
    buyer = await create_test_user(db, email="buyer@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(
        db, seller=seller, category=category, price=100.00, status=ListingStatus.ACTIVE
    )
    await db.commit()
    
    create_data = OrderCreate(
        listing_id=listing.id,
        buyer_address="123 Main St, Hanoi",
    )
    
    order = await create_direct_order(db, buyer_id=buyer.id, obj_in=create_data)
    
    assert order is not None
    assert order.buyer_id == buyer.id
    assert order.seller_id == seller.id
    assert order.status == OrderStatus.PENDING
    assert order.final_price == 100.0


@pytest.mark.asyncio
async def test_get_order_by_id(db: AsyncSession):
    """Test retrieving an order by ID."""
    seller = await create_test_user(db, email="seller2@example.com")
    buyer = await create_test_user(db, email="buyer2@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    order = await create_test_order(db, listing=listing, buyer=buyer, seller=seller)
    
    await db.commit()
    
    result = await get_order_by_id(db, order_id=order.id)
    
    assert result is not None
    assert result.id == order.id


@pytest.mark.asyncio
async def test_get_user_orders_as_buyer(db: AsyncSession):
    """Test retrieving orders for a user as buyer."""
    seller = await create_test_user(db, email="seller3@example.com")
    buyer = await create_test_user(db, email="buyer3@example.com")
    category = await create_test_category(db)
    
    listing1 = await create_test_listing(db, seller=seller, category=category)
    listing2 = await create_test_listing(db, seller=seller, category=category)
    
    await create_test_order(db, listing=listing1, buyer=buyer, seller=seller)
    await create_test_order(db, listing=listing2, buyer=buyer, seller=seller)
    
    await db.commit()
    
    orders = await get_user_orders(db, user_id=buyer.id)
    
    assert len(orders) >= 2
    assert all(o.buyer_id == buyer.id for o in orders)


@pytest.mark.asyncio
async def test_get_user_orders_as_seller(db: AsyncSession):
    """Test retrieving orders for a user as seller."""
    seller = await create_test_user(db, email="seller4@example.com")
    buyer1 = await create_test_user(db, email="buyer4@example.com")
    buyer2 = await create_test_user(db, email="buyer5@example.com")
    category = await create_test_category(db)
    
    listing1 = await create_test_listing(db, seller=seller, category=category)
    listing2 = await create_test_listing(db, seller=seller, category=category)
    
    await create_test_order(db, listing=listing1, buyer=buyer1, seller=seller)
    await create_test_order(db, listing=listing2, buyer=buyer2, seller=seller)
    
    await db.commit()
    
    orders = await get_user_orders(db, user_id=seller.id)
    
    assert len(orders) >= 2


@pytest.mark.asyncio
async def test_complete_order_success(db: AsyncSession):
    """Test completing an order."""
    seller = await create_test_user(db, email="seller5@example.com")
    buyer = await create_test_user(db, email="buyer6@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    order = await create_test_order(
        db, listing=listing, buyer=buyer, seller=seller, status=OrderStatus.PENDING
    )
    
    await db.commit()
    
    completed_order = await complete_order(db, order_id=order.id)
    
    assert completed_order.status == OrderStatus.COMPLETED


@pytest.mark.asyncio
async def test_cancel_order_success(db: AsyncSession):
    """Test canceling an order."""
    seller = await create_test_user(db, email="seller6@example.com")
    buyer = await create_test_user(db, email="buyer7@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    order = await create_test_order(
        db, listing=listing, buyer=buyer, seller=seller, status=OrderStatus.PENDING
    )
    
    await db.commit()
    
    canceled_order = await cancel_order(db, order_id=order.id)
    
    assert canceled_order.status == OrderStatus.CANCELLED


@pytest.mark.asyncio
async def test_api_create_direct_order(client: AsyncClient, db: AsyncSession):
    """Test creating a direct order via API."""
    seller = await create_test_user(db, email="api_seller@example.com")
    buyer = await create_test_user(db, email="api_buyer@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE, price=150.00
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
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "listing_id": str(listing.id),
            "buyer_address": "456 Oak Ave, Ho Chi Minh",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["buyer_id"] == str(buyer.id)
    assert data["seller_id"] == str(seller.id)
    assert data["final_price"] == 150.0
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_api_get_user_orders(client: AsyncClient, db: AsyncSession):
    """Test retrieving user orders via API."""
    seller = await create_test_user(db, email="api_seller2@example.com")
    buyer = await create_test_user(db, email="api_buyer2@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    await create_test_order(db, listing=listing, buyer=buyer, seller=seller)
    
    await db.commit()
    
    buyer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "api_buyer2@example.com",
            "password": "TestPassword123",
        },
    )
    token = buyer_login.json()["access_token"]
    
    response = await client.get(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_api_get_order_detail(client: AsyncClient, db: AsyncSession):
    """Test retrieving order detail via API."""
    seller = await create_test_user(db, email="api_seller3@example.com")
    buyer = await create_test_user(db, email="api_buyer3@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    order = await create_test_order(db, listing=listing, buyer=buyer, seller=seller)
    
    await db.commit()
    
    buyer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "api_buyer3@example.com",
            "password": "TestPassword123",
        },
    )
    token = buyer_login.json()["access_token"]
    
    response = await client.get(
        f"/api/v1/orders/{order.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(order.id)


@pytest.mark.asyncio
async def test_api_complete_order(client: AsyncClient, db: AsyncSession):
    """Test completing an order via API."""
    seller = await create_test_user(db, email="complete_seller@example.com")
    buyer = await create_test_user(db, email="complete_buyer@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    order = await create_test_order(
        db,
        listing=listing,
        buyer=buyer,
        seller=seller,
        status=OrderStatus.PENDING,
    )
    
    await db.commit()
    
    seller_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "complete_seller@example.com",
            "password": "TestPassword123",
        },
    )
    token = seller_login.json()["access_token"]
    
    response = await client.post(
        f"/api/v1/orders/{order.id}/complete",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_api_cancel_order(client: AsyncClient, db: AsyncSession):
    """Test canceling an order via API."""
    seller = await create_test_user(db, email="cancel_seller@example.com")
    buyer = await create_test_user(db, email="cancel_buyer@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
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
            "email": "cancel_buyer@example.com",
            "password": "TestPassword123",
        },
    )
    token = buyer_login.json()["access_token"]
    
    response = await client.post(
        f"/api/v1/orders/{order.id}/cancel",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"
