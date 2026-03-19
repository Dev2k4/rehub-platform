"""Tests for offer (negotiation) CRUD operations."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import ListingStatus, OfferStatus
from app.crud.crud_offer import (
    create_offer,
    get_offers_by_listing,
    get_user_sent_offers,
    get_seller_received_offers,
    update_offer_status,
)
from app.schemas.offer import OfferCreate
from tests.utils import (
    create_test_user,
    create_test_category,
    create_test_listing,
    create_test_offer,
)


@pytest.mark.asyncio
async def test_create_offer_success(db: AsyncSession):
    """Test creating an offer for a listing."""
    seller = await create_test_user(db, email="seller@example.com")
    buyer = await create_test_user(db, email="buyer@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(
        db, seller=seller, category=category, price=100.00
    )
    await db.commit()
    
    create_data = OfferCreate(
        listing_id=listing.id,
        offer_price=80.00,
    )
    
    offer = await create_offer(db, buyer_id=buyer.id, obj_in=create_data)
    
    assert offer is not None
    assert offer.buyer_id == buyer.id
    assert offer.listing_id == listing.id
    assert offer.offer_price == 80.00
    assert offer.status == OfferStatus.PENDING


@pytest.mark.asyncio
async def test_get_offers_by_listing(db: AsyncSession):
    """Test retrieving all offers for a listing."""
    seller = await create_test_user(db, email="seller2@example.com")
    buyer1 = await create_test_user(db, email="buyer1@example.com")
    buyer2 = await create_test_user(db, email="buyer2@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    
    # Create multiple offers
    await create_test_offer(db, listing=listing, buyer=buyer1, offer_price=80.00)
    await create_test_offer(db, listing=listing, buyer=buyer2, offer_price=85.00)
    
    await db.commit()
    
    offers = await get_offers_by_listing(db, listing_id=listing.id)
    
    assert len(offers) == 2
    assert all(o.listing_id == listing.id for o in offers)


@pytest.mark.asyncio
async def test_get_user_sent_offers(db: AsyncSession):
    """Test retrieving offers sent by a buyer."""
    seller = await create_test_user(db, email="seller3@example.com")
    buyer = await create_test_user(db, email="buyer3@example.com")
    category = await create_test_category(db)
    
    listing1 = await create_test_listing(db, seller=seller, category=category)
    listing2 = await create_test_listing(db, seller=seller, category=category)
    
    await create_test_offer(db, listing=listing1, buyer=buyer)
    await create_test_offer(db, listing=listing2, buyer=buyer)
    
    await db.commit()
    
    sent_offers = await get_user_sent_offers(db, buyer_id=buyer.id)
    
    assert len(sent_offers) == 2
    assert all(o.buyer_id == buyer.id for o in sent_offers)


@pytest.mark.asyncio
async def test_get_seller_received_offers(db: AsyncSession):
    """Test retrieving offers received by a seller."""
    seller = await create_test_user(db, email="seller4@example.com")
    buyer1 = await create_test_user(db, email="buyer4@example.com")
    buyer2 = await create_test_user(db, email="buyer5@example.com")
    category = await create_test_category(db)
    
    listing1 = await create_test_listing(db, seller=seller, category=category)
    listing2 = await create_test_listing(db, seller=seller, category=category)
    
    await create_test_offer(db, listing=listing1, buyer=buyer1)
    await create_test_offer(db, listing=listing2, buyer=buyer2)
    
    await db.commit()
    
    received_offers = await get_seller_received_offers(db, seller_id=seller.id)
    
    assert len(received_offers) == 2
    assert all(
        o.listing.seller_id == seller.id for o in received_offers  # type: ignore
    )


@pytest.mark.asyncio
async def test_update_offer_status_to_accepted(db: AsyncSession):
    """Test accepting an offer."""
    seller = await create_test_user(db, email="seller5@example.com")
    buyer = await create_test_user(db, email="buyer6@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    offer = await create_test_offer(db, listing=listing, buyer=buyer)
    
    await db.commit()
    
    updated = await update_offer_status(
        db, offer_id=offer.id, status=OfferStatus.ACCEPTED
    )
    
    assert updated.status == OfferStatus.ACCEPTED


@pytest.mark.asyncio
async def test_update_offer_status_to_rejected(db: AsyncSession):
    """Test rejecting an offer."""
    seller = await create_test_user(db, email="seller6@example.com")
    buyer = await create_test_user(db, email="buyer7@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category)
    offer = await create_test_offer(db, listing=listing, buyer=buyer)
    
    await db.commit()
    
    updated = await update_offer_status(
        db, offer_id=offer.id, status=OfferStatus.REJECTED
    )
    
    assert updated.status == OfferStatus.REJECTED


@pytest.mark.asyncio
async def test_update_offer_status_to_countered(db: AsyncSession):
    """Test counter-offering an offer."""
    seller = await create_test_user(db, email="seller7@example.com")
    buyer = await create_test_user(db, email="buyer8@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(db, seller=seller, category=category, price=100.00)
    offer = await create_test_offer(
        db, listing=listing, buyer=buyer, offer_price=80.00
    )
    
    await db.commit()
    
    updated = await update_offer_status(
        db, offer_id=offer.id, status=OfferStatus.COUNTERED
    )
    
    assert updated.status == OfferStatus.COUNTERED


@pytest.mark.asyncio
async def test_api_create_offer(client: AsyncClient, db: AsyncSession):
    """Test creating an offer via API."""
    seller = await create_test_user(db, email="api_seller@example.com")
    buyer = await create_test_user(db, email="api_buyer@example.com")
    category = await create_test_category(db)
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    await db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "api_buyer@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    response = await client.post(
        "/api/v1/offers",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "listing_id": str(listing.id),
            "offer_price": 75.00,
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["buyer_id"] == str(buyer.id)
    assert data["offer_price"] == 75.0
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_api_get_sent_offers(client: AsyncClient, db: AsyncSession):
    """Test retrieving sent offers via API."""
    seller = await create_test_user(db, email="api_seller2@example.com")
    buyer = await create_test_user(db, email="api_buyer2@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    await create_test_offer(db, listing=listing, buyer=buyer)
    
    await db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "api_buyer2@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    response = await client.get(
        "/api/v1/offers/sent",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_api_get_received_offers(client: AsyncClient, db: AsyncSession):
    """Test retrieving received offers via API."""
    seller = await create_test_user(db, email="api_seller3@example.com")
    buyer = await create_test_user(db, email="api_buyer3@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    await create_test_offer(db, listing=listing, buyer=buyer)
    
    await db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "api_seller3@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    response = await client.get(
        "/api/v1/offers/received",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_api_accept_offer(client: AsyncClient, db: AsyncSession):
    """Test accepting an offer via API."""
    seller = await create_test_user(db, email="accept_seller@example.com")
    buyer = await create_test_user(db, email="accept_buyer@example.com")
    category = await create_test_category(db)
    
    listing = await create_test_listing(
        db, seller=seller, category=category, status=ListingStatus.ACTIVE
    )
    offer = await create_test_offer(db, listing=listing, buyer=buyer)
    
    await db.commit()
    
    seller_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "accept_seller@example.com",
            "password": "TestPassword123",
        },
    )
    token = seller_login.json()["access_token"]
    
    response = await client.patch(
        f"/api/v1/offers/{offer.id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "accepted"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
