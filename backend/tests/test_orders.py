import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.listing import Listing
from app.models.enums import ListingStatus
from app.crud.crud_listing import get_listing, update_listing

async def setup_users(client: AsyncClient, db: AsyncSession):
    bemail = f"buyer_{uuid.uuid4()}@example.com"
    semail = f"seller_{uuid.uuid4()}@example.com"

    rb = await client.post("/api/v1/auth/register", json={"email": bemail, "password": "Password123!", "full_name": "Buyer"})
    assert rb.status_code == 201, f"Buyer reg fail: {rb.text}"
    
    rs = await client.post("/api/v1/auth/register", json={"email": semail, "password": "Password123!", "full_name": "Seller"})
    assert rs.status_code == 201, f"Seller reg fail: {rs.text}"
    
    res_b = await client.post("/api/v1/auth/login", data={"username": bemail, "password": "Password123!"})
    res_s = await client.post("/api/v1/auth/login", data={"username": semail, "password": "Password123!"})
    
    return res_b.json()["access_token"], res_s.json()["access_token"]

@pytest.mark.asyncio
async def test_order_flow(client: AsyncClient, db: AsyncSession):
    buyer_token, seller_token = await setup_users(client, db)
    
    headers_seller = {"Authorization": f"Bearer {seller_token}"}
    headers_buyer = {"Authorization": f"Bearer {buyer_token}"}
    
    cat_id = uuid.uuid4()
    db.add(Category(id=cat_id, name="Test Orders Category", slug="test-orders-cat"))
    await db.commit()
    
    res = await client.post(
        "/api/v1/listings/",
        headers=headers_seller,
        json={
            "title": "Buy My Item",
            "price": "100.00",
            "is_negotiable": False,
            "condition_grade": "brand_new",
            "category_id": str(cat_id)
        }
    )
    assert res.status_code == 201, f"Listing fail: {res.text}"
    listing_id = res.json()["id"]
    
    # Manually update listing status bypass HTTP
    from app.schemas.listing import ListingUpdate as LUpdate
    listing = await get_listing(db, uuid.UUID(listing_id))
    listing.status = ListingStatus.ACTIVE
    db.add(listing)
    await db.commit()
    
    order_res = await client.post("/api/v1/orders", headers=headers_buyer, json={"listing_id": listing_id})
    assert order_res.status_code == 201, f"Order fail: {order_res.text}"
    order_id = order_res.json()["id"]
    
    comp_res = await client.post(f"/api/v1/orders/{order_id}/complete", headers=headers_buyer)
    assert comp_res.status_code == 200, f"Complete fail: {comp_res.text}"
    
    review_res = await client.post("/api/v1/reviews", headers=headers_buyer, json={
        "order_id": order_id,
        "rating": 5,
        "comment": "Great seller!"
    })
    assert review_res.status_code == 201, f"Review fail: {review_res.text}"
