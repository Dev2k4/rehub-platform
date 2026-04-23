import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_listing import get_listing
from app.models.category import Category
from app.models.enums import ListingStatus


async def setup_users(client: AsyncClient):
    buyer_email = f"buyer_{uuid.uuid4()}@example.com"
    seller_email = f"seller_{uuid.uuid4()}@example.com"

    buyer_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": buyer_email, "password": "Password123!", "full_name": "Buyer"},
    )
    assert buyer_reg.status_code == 201, buyer_reg.text

    seller_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": seller_email, "password": "Password123!", "full_name": "Seller"},
    )
    assert seller_reg.status_code == 201, seller_reg.text

    buyer_login = await client.post(
        "/api/v1/auth/login",
        data={"username": buyer_email, "password": "Password123!"},
    )
    seller_login = await client.post(
        "/api/v1/auth/login",
        data={"username": seller_email, "password": "Password123!"},
    )

    assert buyer_login.status_code == 200, buyer_login.text
    assert seller_login.status_code == 200, seller_login.text

    return buyer_login.json()["access_token"], seller_login.json()["access_token"]


@pytest.mark.asyncio
async def test_fulfillment_escrow_flow(client: AsyncClient, db: AsyncSession):
    buyer_token, seller_token = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    category_id = uuid.uuid4()
    db.add(Category(id=category_id, name="Fulfillment Category", slug="fulfillment-category"))
    await db.commit()

    listing_resp = await client.post(
        "/api/v1/listings/",
        headers=seller_headers,
        json={
            "title": "Order With Fulfillment",
            "price": "120.00",
            "is_negotiable": False,
            "condition_grade": "brand_new",
            "category_id": str(category_id),
        },
    )
    assert listing_resp.status_code == 201, listing_resp.text
    listing_id = listing_resp.json()["id"]

    listing = await get_listing(db, uuid.UUID(listing_id))
    listing.status = ListingStatus.ACTIVE
    db.add(listing)
    await db.commit()

    order_resp = await client.post(
        "/api/v1/orders",
        headers=buyer_headers,
        json={"listing_id": listing_id, "use_escrow": True},
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]

    fulfillment_resp = await client.get(
        f"/api/v1/fulfillments/{order_id}",
        headers=buyer_headers,
    )
    assert fulfillment_resp.status_code == 200, fulfillment_resp.text
    assert fulfillment_resp.json()["status"] == "pending_seller_start"

    blocked_start_resp = await client.post(
        f"/api/v1/fulfillments/{order_id}/start-preparing",
        headers=seller_headers,
    )
    assert blocked_start_resp.status_code == 400, blocked_start_resp.text
    assert "Escrow must be funded" in blocked_start_resp.json()["detail"]

    topup_resp = await client.post(
        "/api/v1/wallet/demo-topup",
        headers=buyer_headers,
        json={"amount": "200.00"},
    )
    assert topup_resp.status_code == 200, topup_resp.text

    fund_resp = await client.post(
        f"/api/v1/escrows/{order_id}/fund",
        headers=buyer_headers,
    )
    assert fund_resp.status_code == 200, fund_resp.text
    assert fund_resp.json()["status"] == "held"

    start_resp = await client.post(
        f"/api/v1/fulfillments/{order_id}/start-preparing",
        headers=seller_headers,
    )
    assert start_resp.status_code == 200, start_resp.text
    assert start_resp.json()["status"] == "preparing"

    order_after_start = await client.get(f"/api/v1/orders/{order_id}", headers=buyer_headers)
    assert order_after_start.status_code == 200, order_after_start.text
    assert order_after_start.json()["status"] == "preparing"

    shipping_resp = await client.post(
        f"/api/v1/fulfillments/{order_id}/mark-shipping",
        headers=seller_headers,
        json={},
    )
    assert shipping_resp.status_code == 200, shipping_resp.text
    assert shipping_resp.json()["status"] == "in_delivery"

    mark_delivered_resp = await client.post(
        f"/api/v1/fulfillments/{order_id}/mark-delivered",
        headers=seller_headers,
        json={
            "proof_image_urls": ["https://example.com/seller-proof-1.jpg"],
            "note": "Package delivered to courier",
        },
    )
    assert mark_delivered_resp.status_code == 200, mark_delivered_resp.text
    assert mark_delivered_resp.json()["status"] == "delivered_by_seller"

    buyer_confirm_resp = await client.post(
        f"/api/v1/fulfillments/{order_id}/buyer-confirm",
        headers=buyer_headers,
        json={
            "proof_image_urls": ["https://example.com/buyer-proof-1.jpg"],
            "note": "Received in good condition",
        },
    )
    assert buyer_confirm_resp.status_code == 200, buyer_confirm_resp.text
    assert buyer_confirm_resp.json()["status"] == "buyer_confirmed_received"

    order_after_confirm = await client.get(f"/api/v1/orders/{order_id}", headers=seller_headers)
    assert order_after_confirm.status_code == 200, order_after_confirm.text
    assert order_after_confirm.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_fulfillment_requires_proof_images(client: AsyncClient, db: AsyncSession):
    buyer_token, seller_token = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    category_id = uuid.uuid4()
    db.add(Category(id=category_id, name="Proof Category", slug="proof-category"))
    await db.commit()

    listing_resp = await client.post(
        "/api/v1/listings/",
        headers=seller_headers,
        json={
            "title": "Proof Listing",
            "price": "90.00",
            "is_negotiable": False,
            "condition_grade": "brand_new",
            "category_id": str(category_id),
        },
    )
    assert listing_resp.status_code == 201, listing_resp.text
    listing_id = listing_resp.json()["id"]

    listing = await get_listing(db, uuid.UUID(listing_id))
    listing.status = ListingStatus.ACTIVE
    db.add(listing)
    await db.commit()

    order_resp = await client.post(
        "/api/v1/orders",
        headers=buyer_headers,
        json={"listing_id": listing_id, "use_escrow": False},
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]

    start_resp = await client.post(
        f"/api/v1/fulfillments/{order_id}/start-preparing",
        headers=seller_headers,
    )
    assert start_resp.status_code == 200, start_resp.text

    shipping_resp = await client.post(
        f"/api/v1/fulfillments/{order_id}/mark-shipping",
        headers=seller_headers,
        json={},
    )
    assert shipping_resp.status_code == 200, shipping_resp.text

    mark_delivered_without_proof = await client.post(
        f"/api/v1/fulfillments/{order_id}/mark-delivered",
        headers=seller_headers,
        json={"proof_image_urls": []},
    )
    assert mark_delivered_without_proof.status_code == 422
