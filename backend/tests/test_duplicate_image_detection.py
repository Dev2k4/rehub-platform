import uuid
from io import BytesIO

import pytest
from httpx import AsyncClient
from PIL import Image, ImageDraw
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.enums import ConditionGrade, ListingStatus, UserRole
from app.models.listing import Listing, ListingImage
from app.models.user import User
from app.core.security import hash_password
from app.services.duplicate_image_service import DuplicateImageService


def _make_test_image_bytes(
    background: tuple[int, int, int] = (240, 240, 240),
    accent: tuple[int, int, int] = (200, 0, 0),
    variant: str = "diagonal",
) -> bytes:
    image = Image.new("RGB", (256, 256), color=background)
    drawer = ImageDraw.Draw(image)
    drawer.rectangle((48, 48, 208, 208), outline=(40, 40, 40), width=8)
    if variant == "diagonal":
        drawer.line((48, 208, 208, 48), fill=accent, width=6)
    elif variant == "bars":
        for column in range(56, 208, 24):
            drawer.rectangle((column, 56, column + 10, 200), fill=accent)
    else:
        drawer.ellipse((72, 72, 184, 184), outline=accent, width=10)

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


async def _create_user_and_login(client: AsyncClient, db: AsyncSession, email: str) -> str:
    user = User(
        email=email,
        password_hash=hash_password("Password123!"),
        full_name="Test User",
        is_email_verified=True,
        role=UserRole.USER,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "Password123!"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_duplicate_image_service_detects_existing_hash(db: AsyncSession):
    seller = User(
        email="seller-hash@example.com",
        password_hash="hash",
        full_name="Seller Hash",
        role=UserRole.USER,
    )
    category = Category(id=uuid.uuid4(), name="Electronics Hash", slug="electronics-hash")
    db.add(seller)
    db.add(category)
    await db.commit()

    listing = Listing(
        seller_id=seller.id,
        category_id=category.id,
        title="Test phone",
        description="Test phone",
        price=1000000,
        condition_grade=ConditionGrade.LIKE_NEW,
        status=ListingStatus.ACTIVE,
    )
    db.add(listing)
    await db.commit()

    image_bytes = _make_test_image_bytes()
    perceptual_hash, image_md5 = DuplicateImageService.compute_hashes(image_bytes)

    listing_image = ListingImage(
        listing_id=listing.id,
        image_url="http://example.com/image.webp",
        thumbnail_url="http://example.com/image-thumb.webp",
        perceptual_hash=perceptual_hash,
        image_md5=image_md5,
    )
    db.add(listing_image)
    await db.commit()

    result = await DuplicateImageService.check_duplicate(db, image_bytes)

    assert result.is_duplicate is True
    assert result.duplicate_listing_id == listing.id
    assert result.duplicate_image_id == listing_image.id
    assert result.similarity_score == 100


@pytest.mark.asyncio
async def test_uploading_same_image_twice_is_blocked(
    client: AsyncClient,
    db: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
):
    await db.execute(delete(ListingImage))
    await db.commit()

    token = await _create_user_and_login(client, db, "seller-upload@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    category = Category(id=uuid.uuid4(), name="Duplicate Category", slug="duplicate-category")
    db.add(category)
    await db.commit()

    listing_response = await client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "title": "Duplicate test listing",
            "description": "For duplicate image detection",
            "price": "1000000",
            "is_negotiable": True,
            "condition_grade": "like_new",
            "category_id": str(category.id),
        },
    )
    assert listing_response.status_code == 201
    listing_id = listing_response.json()["id"]

    from app.api.v1 import listings as listings_module

    monkeypatch.setattr(
        listings_module,
        "upload_to_object_storage",
        lambda **kwargs: ("http://example.com/uploaded.webp", "http://example.com/uploaded-thumb.webp"),
    )

    image_bytes = _make_test_image_bytes(
        background=(230, 244, 255),
        accent=(0, 72, 200),
        variant="bars",
    )

    first_upload = await client.post(
        f"/api/v1/listings/{listing_id}/images",
        headers=headers,
        files={"file": ("test.png", image_bytes, "image/png")},
    )
    assert first_upload.status_code == 200

    second_upload = await client.post(
        f"/api/v1/listings/{listing_id}/images",
        headers=headers,
        files={"file": ("test.png", image_bytes, "image/png")},
    )
    assert second_upload.status_code == 409
    assert second_upload.json()["detail"]["code"] == "DUPLICATE_IMAGE"

    stored_images = (
        await db.execute(select(ListingImage).where(ListingImage.listing_id == uuid.UUID(listing_id)))
    ).scalars().all()
    assert len(stored_images) == 1
    assert stored_images[0].perceptual_hash is not None
    assert stored_images[0].image_md5 is not None