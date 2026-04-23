import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud import crud_escrow
from app.crud.crud_listing import get_listing
from app.models.category import Category
from app.models.enums import EscrowStatus, FulfillmentStatus, ListingStatus, OrderStatus
from app.models.escrow import Escrow
from app.models.order import Order


async def setup_users(client: AsyncClient) -> tuple[str, str]:
    buyer_email = f"buyer_{uuid.uuid4()}@example.com"
    seller_email = f"seller_{uuid.uuid4()}@example.com"

    buyer_register = await client.post(
        "/api/v1/auth/register",
        json={"email": buyer_email, "password": "Password123!", "full_name": "Buyer"},
    )
    assert buyer_register.status_code == 201, buyer_register.text

    seller_register = await client.post(
        "/api/v1/auth/register",
        json={"email": seller_email, "password": "Password123!", "full_name": "Seller"},
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

    return buyer_login.json()["access_token"], seller_login.json()["access_token"]


async def create_active_listing(
    client: AsyncClient,
    db: AsyncSession,
    seller_headers: dict[str, str],
) -> str:
    category_id = uuid.uuid4()
    db.add(Category(id=category_id, name="Escrow Test Category", slug=f"escrow-test-{category_id.hex[:8]}"))
    await db.commit()

    listing_response = await client.post(
        "/api/v1/listings/",
        headers=seller_headers,
        json={
            "title": "Escrow Listing",
            "price": "120.00",
            "is_negotiable": False,
            "condition_grade": "like_new",
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
async def test_escrow_lifecycle_completes_with_fulfillment_milestones(
    client: AsyncClient,
    db: AsyncSession,
):
    buyer_token, seller_token = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    listing_id = await create_active_listing(client, db, seller_headers)

    order_response = await client.post(
        "/api/v1/orders",
        headers=buyer_headers,
        json={"listing_id": listing_id, "use_escrow": True},
    )
    assert order_response.status_code == 201, order_response.text
    order_payload = order_response.json()
    order_id = order_payload["id"]
    assert order_payload["fulfillment_status"] == "awaiting_funding"

    escrow_response = await client.get(f"/api/v1/escrows/{order_id}", headers=buyer_headers)
    assert escrow_response.status_code == 200, escrow_response.text
    assert escrow_response.json()["status"] == "awaiting_funding"

    topup_response = await client.post(
        "/api/v1/wallet/demo-topup",
        headers=buyer_headers,
        json={"amount": "120.00"},
    )
    assert topup_response.status_code == 200, topup_response.text

    fund_response = await client.post(f"/api/v1/escrows/{order_id}/fund", headers=buyer_headers)
    assert fund_response.status_code == 200, fund_response.text
    assert fund_response.json()["status"] == "held"

    release_request_response = await client.post(
        f"/api/v1/escrows/{order_id}/release-request",
        headers=seller_headers,
    )
    assert release_request_response.status_code == 200, release_request_response.text
    assert release_request_response.json()["status"] == "release_pending"

    confirm_response = await client.post(
        f"/api/v1/escrows/{order_id}/confirm-release",
        headers=buyer_headers,
    )
    assert confirm_response.status_code == 200, confirm_response.text
    assert confirm_response.json()["status"] == "released"

    final_order_response = await client.get(f"/api/v1/orders/{order_id}", headers=buyer_headers)
    assert final_order_response.status_code == 200, final_order_response.text
    final_order = final_order_response.json()
    assert final_order["status"] == "completed"
    assert final_order["fulfillment_status"] == "buyer_confirmed_received"
    assert final_order["seller_marked_delivered_at"] is not None
    assert final_order["buyer_confirmed_received_at"] is not None

    events_response = await client.get(
        f"/api/v1/escrows/{order_id}/events",
        headers=buyer_headers,
    )
    assert events_response.status_code == 200, events_response.text
    event_types = [event["event_type"] for event in events_response.json()]
    assert event_types == [
        "created",
        "funded",
        "seller_mark_delivered",
        "buyer_confirm",
    ]


@pytest.mark.asyncio
async def test_escrow_dispute_updates_order_fulfillment_status(
    client: AsyncClient,
    db: AsyncSession,
):
    buyer_token, seller_token = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    listing_id = await create_active_listing(client, db, seller_headers)

    order_response = await client.post(
        "/api/v1/orders",
        headers=buyer_headers,
        json={"listing_id": listing_id, "use_escrow": True},
    )
    assert order_response.status_code == 201, order_response.text
    order_id = order_response.json()["id"]

    topup_response = await client.post(
        "/api/v1/wallet/demo-topup",
        headers=buyer_headers,
        json={"amount": "120.00"},
    )
    assert topup_response.status_code == 200, topup_response.text

    fund_response = await client.post(f"/api/v1/escrows/{order_id}/fund", headers=buyer_headers)
    assert fund_response.status_code == 200, fund_response.text

    dispute_response = await client.post(
        f"/api/v1/escrows/{order_id}/open-dispute",
        headers=buyer_headers,
        json={"note": "Item not as described"},
    )
    assert dispute_response.status_code == 200, dispute_response.text
    assert dispute_response.json()["status"] == "disputed"

    final_order_response = await client.get(f"/api/v1/orders/{order_id}", headers=seller_headers)
    assert final_order_response.status_code == 200, final_order_response.text
    final_order = final_order_response.json()
    assert final_order["status"] == "disputed"
    assert final_order["fulfillment_status"] == "disputed"


@pytest.mark.asyncio
async def test_expire_unfunded_escrow_cancels_order_and_reactivates_listing(
    client: AsyncClient,
    db: AsyncSession,
):
    buyer_token, seller_token = await setup_users(client)
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    listing_id = await create_active_listing(client, db, seller_headers)

    order_response = await client.post(
        "/api/v1/orders",
        headers=buyer_headers,
        json={"listing_id": listing_id, "use_escrow": True},
    )
    assert order_response.status_code == 201, order_response.text
    order_id = order_response.json()["id"]

    escrow_result = await db.execute(select(Escrow).where(Escrow.order_id == uuid.UUID(order_id)))
    escrow = escrow_result.scalar_one_or_none()
    assert escrow is not None
    escrow.created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=72)
    db.add(escrow)
    await db.commit()

    expired = await crud_escrow.expire_unfunded_escrows(db)
    assert len(expired) == 1
    assert str(expired[0]["order_id"]) == order_id

    refreshed_escrow_result = await db.execute(select(Escrow).where(Escrow.order_id == uuid.UUID(order_id)))
    refreshed_escrow = refreshed_escrow_result.scalar_one_or_none()
    assert refreshed_escrow is not None
    assert refreshed_escrow.status == EscrowStatus.EXPIRED

    order_result = await db.execute(select(Order).where(Order.id == uuid.UUID(order_id)))
    order = order_result.scalar_one_or_none()
    assert order is not None
    assert order.status == OrderStatus.CANCELLED
    assert order.fulfillment_status == FulfillmentStatus.CANCELLED

    listing = await get_listing(db, uuid.UUID(listing_id))
    assert listing is not None
    assert listing.status == ListingStatus.ACTIVE
