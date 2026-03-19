"""Test utilities and helper functions for creating test data."""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.category import Category
from app.models.listing import Listing, ListingImage
from app.models.offer import Offer
from app.models.order import Order
from app.models.review import Review
from app.models.enums import UserRole, ListingStatus, ConditionGrade, OfferStatus, OrderStatus
from app.core.security import hash_password


async def create_test_user(
    db: AsyncSession,
    email: str = "test@example.com",
    password: str = "TestPassword123",
    full_name: str = "Test User",
    role: UserRole = UserRole.USER,
    is_email_verified: bool = True,
) -> User:
    """Create a test user in the database."""
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        phone="+84909999999",
        role=role,
        is_email_verified=is_email_verified,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    return user


async def create_test_category(
    db: AsyncSession,
    name: str = "Electronics",
    slug: str = "electronics",
    parent_id: uuid.UUID | None = None,
) -> Category:
    """Create a test category."""
    category = Category(
        id=uuid.uuid4(),
        name=name,
        slug=slug,
        parent_id=parent_id,
    )
    db.add(category)
    await db.flush()
    return category


async def create_test_listing(
    db: AsyncSession,
    seller: User,
    category: Category,
    title: str = "Test Product",
    price: float = 100.00,
    condition_grade: ConditionGrade = ConditionGrade.LIKE_NEW,
    status: ListingStatus = ListingStatus.ACTIVE,
    is_negotiable: bool = True,
) -> Listing:
    """Create a test listing."""
    listing = Listing(
        id=uuid.uuid4(),
        seller_id=seller.id,
        category_id=category.id,
        title=title,
        description="Test product description",
        price=price,
        condition_grade=condition_grade,
        is_negotiable=is_negotiable,
        status=status,
    )
    db.add(listing)
    await db.flush()
    return listing


async def create_test_listing_image(
    db: AsyncSession,
    listing: Listing,
    image_url: str = "http://example.com/image.jpg",
    is_primary: bool = False,
) -> ListingImage:
    """Create a test listing image."""
    image = ListingImage(
        id=uuid.uuid4(),
        listing_id=listing.id,
        image_url=image_url,
        is_primary=is_primary,
    )
    db.add(image)
    await db.flush()
    return image


async def create_test_offer(
    db: AsyncSession,
    listing: Listing,
    buyer: User,
    offer_price: float = 80.00,
    status: OfferStatus = OfferStatus.PENDING,
) -> Offer:
    """Create a test offer."""
    offer = Offer(
        id=uuid.uuid4(),
        listing_id=listing.id,
        buyer_id=buyer.id,
        offer_price=offer_price,
        status=status,
    )
    db.add(offer)
    await db.flush()
    return offer


async def create_test_order(
    db: AsyncSession,
    listing: Listing,
    buyer: User,
    seller: User,
    price: float = 100.00,
    status: OrderStatus = OrderStatus.PENDING,
) -> Order:
    """Create a test order."""
    order = Order(
        id=uuid.uuid4(),
        listing_id=listing.id,
        buyer_id=buyer.id,
        seller_id=seller.id,
        final_price=price,
        status=status,
    )
    db.add(order)
    await db.flush()
    return order


async def create_test_review(
    db: AsyncSession,
    order: Order,
    reviewer: User,
    rating: int = 5,
    comment: str = "Great product!",
) -> Review:
    """Create a test review."""
    review = Review(
        id=uuid.uuid4(),
        order_id=order.id,
        reviewer_id=reviewer.id,
        rating=rating,
        comment=comment,
    )
    db.add(review)
    await db.flush()
    return review
