import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.crud import crud_notification
from app.models.category import Category
from app.models.enums import ListingStatus, NotificationType, OrderStatus, UserRole
from app.models.listing import Listing
from app.models.notification import Notification
from app.models.order import Order
from app.models.user import User
from app.services.websocket_manager import connection_manager


PASSWORD = "Password123!"


async def create_verified_user(
    db: AsyncSession,
    *,
    email: str,
    full_name: str,
    role: UserRole = UserRole.USER,
) -> User:
    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(PASSWORD),
        is_email_verified=True,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


async def create_category(db: AsyncSession, *, name_prefix: str) -> Category:
    unique_id = uuid.uuid4().hex[:8]
    category = Category(
        id=uuid.uuid4(),
        name=f"{name_prefix} {unique_id}",
        slug=f"{name_prefix.lower()}-{unique_id}",
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def create_listing_via_api(
    client: AsyncClient,
    *,
    token: str,
    category_id: uuid.UUID,
    title: str,
    price: str,
) -> dict:
    response = await client.post(
        "/api/v1/listings/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": title,
            "price": price,
            "is_negotiable": False,
            "condition_grade": "good",
            "category_id": str(category_id),
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def set_listing_status(db: AsyncSession, listing_id: str, status: ListingStatus) -> Listing:
    listing = (
        await db.execute(select(Listing).where(Listing.id == uuid.UUID(listing_id)))
    ).scalar_one()
    listing.status = status
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing


@pytest.mark.asyncio
async def test_review_lifecycle_and_authorization(client: AsyncClient, db: AsyncSession):
    buyer = await create_verified_user(db, email=f"buyer_{uuid.uuid4().hex}@example.com", full_name="Buyer")
    seller = await create_verified_user(db, email=f"seller_{uuid.uuid4().hex}@example.com", full_name="Seller")
    outsider = await create_verified_user(db, email=f"outsider_{uuid.uuid4().hex}@example.com", full_name="Outsider")

    buyer_token = await login_user(client, buyer.email)
    seller_token = await login_user(client, seller.email)
    outsider_token = await login_user(client, outsider.email)

    category = await create_category(db, name_prefix="Reviews")
    listing_data = await create_listing_via_api(
        client,
        token=seller_token,
        category_id=category.id,
        title="Test Listing for Review Flow",
        price="123.00",
    )
    await set_listing_status(db, listing_data["id"], ListingStatus.ACTIVE)

    order_response = await client.post(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"listing_id": listing_data["id"], "use_escrow": False},
    )
    assert order_response.status_code == 201, order_response.text
    order_id = order_response.json()["id"]

    incomplete_review_response = await client.post(
        "/api/v1/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"order_id": order_id, "rating": 5, "comment": "Too early"},
    )
    assert incomplete_review_response.status_code == 400
    assert "incomplete order" in incomplete_review_response.json()["detail"].lower()

    complete_response = await client.post(
        f"/api/v1/orders/{order_id}/complete",
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert complete_response.status_code == 200, complete_response.text
    assert complete_response.json()["status"] == OrderStatus.COMPLETED

    unauthorized_review_response = await client.post(
        "/api/v1/reviews",
        headers={"Authorization": f"Bearer {outsider_token}"},
        json={"order_id": order_id, "rating": 4, "comment": "Not my order"},
    )
    assert unauthorized_review_response.status_code == 403

    buyer_review_response = await client.post(
        "/api/v1/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"order_id": order_id, "rating": 5, "comment": "Great transaction"},
    )
    assert buyer_review_response.status_code == 201, buyer_review_response.text
    buyer_review = buyer_review_response.json()
    assert buyer_review["reviewer_id"] == str(buyer.id)
    assert buyer_review["reviewee_id"] == str(seller.id)

    duplicate_review_response = await client.post(
        "/api/v1/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"order_id": order_id, "rating": 4, "comment": "Duplicate"},
    )
    assert duplicate_review_response.status_code == 400
    assert "already reviewed" in duplicate_review_response.json()["detail"].lower()

    seller_review_response = await client.post(
        "/api/v1/reviews",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={"order_id": order_id, "rating": 5, "comment": "Friendly buyer"},
    )
    assert seller_review_response.status_code == 201, seller_review_response.text
    seller_review = seller_review_response.json()
    assert seller_review["reviewer_id"] == str(seller.id)
    assert seller_review["reviewee_id"] == str(buyer.id)

    order_reviews_response = await client.get(f"/api/v1/reviews/{order_id}")
    assert order_reviews_response.status_code == 200, order_reviews_response.text
    assert len(order_reviews_response.json()) == 2

    seller_profile_reviews_response = await client.get(f"/api/v1/reviews/user/{seller.id}")
    assert seller_profile_reviews_response.status_code == 200, seller_profile_reviews_response.text
    assert len(seller_profile_reviews_response.json()) == 1

    seller_after_reviews = (
        await db.execute(select(User).where(User.id == seller.id))
    ).scalar_one()
    buyer_after_reviews = (
        await db.execute(select(User).where(User.id == buyer.id))
    ).scalar_one()
    assert seller_after_reviews.rating_count == 1
    assert float(seller_after_reviews.rating_avg) == 5.0
    assert buyer_after_reviews.rating_count == 1
    assert float(buyer_after_reviews.rating_avg) == 5.0


@pytest.mark.asyncio
async def test_admin_moderation_and_notification_flow(client: AsyncClient, db: AsyncSession):
    admin = await create_verified_user(
        db,
        email=f"admin_{uuid.uuid4().hex}@example.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
    )
    seller = await create_verified_user(
        db,
        email=f"seller_{uuid.uuid4().hex}@example.com",
        full_name="Seller User",
    )
    target_user = await create_verified_user(
        db,
        email=f"target_{uuid.uuid4().hex}@example.com",
        full_name="Target User",
    )

    admin_token = await login_user(client, admin.email)
    seller_token = await login_user(client, seller.email)

    category = await create_category(db, name_prefix="Admin")
    pending_listing = await create_listing_via_api(
        client,
        token=seller_token,
        category_id=category.id,
        title="Pending Listing For Admin Review",
        price="200.00",
    )

    users_response = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert users_response.status_code == 200, users_response.text
    user_ids = {item["id"] for item in users_response.json()}
    assert str(admin.id) in user_ids
    assert str(seller.id) in user_ids
    assert str(target_user.id) in user_ids

    user_status_response = await client.patch(
        f"/api/v1/admin/users/{target_user.id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_active": False},
    )
    assert user_status_response.status_code == 200, user_status_response.text
    assert user_status_response.json()["is_active"] is False

    pending_response = await client.get(
        "/api/v1/admin/listings/pending",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert pending_response.status_code == 200, pending_response.text
    pending_ids = {item["id"] for item in pending_response.json()}
    assert pending_listing["id"] in pending_ids

    approve_response = await client.post(
        f"/api/v1/admin/listings/{pending_listing['id']}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_response.status_code == 200, approve_response.text
    assert approve_response.json()["status"] == ListingStatus.ACTIVE

    second_listing = await create_listing_via_api(
        client,
        token=seller_token,
        category_id=category.id,
        title="Listing To Reject",
        price="150.00",
    )
    await set_listing_status(db, second_listing["id"], ListingStatus.ACTIVE)

    reject_response = await client.post(
        f"/api/v1/admin/listings/{second_listing['id']}/reject",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reject_response.status_code == 200, reject_response.text
    assert reject_response.json()["status"] == ListingStatus.REJECTED

    unread_count_response = await client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert unread_count_response.status_code == 200, unread_count_response.text
    assert unread_count_response.json()["unread_count"] == 2

    history_response = await client.get(
        "/api/v1/notifications/history",
        headers={"Authorization": f"Bearer {seller_token}"},
        params={"read_filter": "unread", "type_filter": "listing", "limit": 20},
    )
    assert history_response.status_code == 200, history_response.text
    history_payload = history_response.json()
    assert history_payload["total"] == 2
    assert history_payload["page"] == 1
    assert history_payload["size"] == 20

    first_notification_id = history_payload["items"][0]["id"]
    mark_read_response = await client.put(
        f"/api/v1/notifications/{first_notification_id}/read",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert mark_read_response.status_code == 200, mark_read_response.text
    assert mark_read_response.json()["is_read"] is True

    unread_after_one_response = await client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert unread_after_one_response.status_code == 200, unread_after_one_response.text
    assert unread_after_one_response.json()["unread_count"] == 1

    read_all_response = await client.put(
        "/api/v1/notifications/read-all",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert read_all_response.status_code == 200, read_all_response.text
    assert read_all_response.json()["updated_count"] == 1

    unread_after_all_response = await client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert unread_after_all_response.status_code == 200, unread_after_all_response.text
    assert unread_after_all_response.json()["unread_count"] == 0

    read_history_response = await client.get(
        "/api/v1/notifications/history",
        headers={"Authorization": f"Bearer {seller_token}"},
        params={"read_filter": "read", "type_filter": "listing", "limit": 20},
    )
    assert read_history_response.status_code == 200, read_history_response.text
    assert read_history_response.json()["total"] == 2

    seller_notifications = (
        await db.execute(select(Notification).where(Notification.user_id == seller.id))
    ).scalars().all()
    assert len(seller_notifications) == 2
    assert {notification.type for notification in seller_notifications} == {
        NotificationType.LISTING_APPROVED,
        NotificationType.LISTING_REJECTED,
    }

    order_rows = (
        await db.execute(select(Order).where(Order.seller_id == seller.id))
    ).scalars().all()
    assert len(order_rows) == 0

    assert await connection_manager.get_connection_count(seller.id) == 0
