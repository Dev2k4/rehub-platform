import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_, update
from app.models.offer import Offer
from app.models.listing import Listing
from app.models.order import Order
from app.models.enums import OfferStatus, ListingStatus, OrderStatus
from app.schemas.offer import OfferCreate, OfferStatusUpdate
from app.core.config import settings


def _utc_now_naive() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def expire_stale_offers(db: AsyncSession) -> int:
    """
    Expire PENDING/COUNTERED offers older than configured TTL.
    Nên được gọi từ background job, không phải inline trong mỗi request.
    """
    cutoff = _utc_now_naive() - timedelta(hours=settings.OFFER_EXPIRE_HOURS)
    result = await db.execute(
        update(Offer)
        .where(
            Offer.created_at <= cutoff,
            Offer.status.in_([OfferStatus.PENDING, OfferStatus.COUNTERED]),
        )
        .values(status=OfferStatus.EXPIRED, updated_at=_utc_now_naive())
    )
    await db.commit()
    return int(result.rowcount or 0)


async def check_existing_pending_offer(
    db: AsyncSession, buyer_id: uuid.UUID, listing_id: uuid.UUID
) -> bool:
    """
    Kiểm tra xem Buyer đã có 1 offer PENDING/COUNTERED trên listing này chưa.
    Nếu có → return True (chặn tạo offer mới). Nếu không → return False (cho phép tạo).
    """
    result = await db.execute(
        select(Offer).where(
            and_(
                Offer.buyer_id == buyer_id,
                Offer.listing_id == listing_id,
                or_(
                    Offer.status == OfferStatus.PENDING,
                    Offer.status == OfferStatus.COUNTERED
                )
            )
        )
    )
    return result.scalar_one_or_none() is not None


async def create_offer(db: AsyncSession, obj_in: OfferCreate, buyer_id: uuid.UUID) -> Offer:
    """
    Tạo offer mới với các ràng buộc:
    1. Buyer không được tự trả giá tin đăng của chính mình.
    2. Tin đăng phải có trạng thái ACTIVE.
    3. Tin đăng phải có is_negotiable = True.
    4. Buyer không được có offer PENDING/COUNTERED trên tin đăng này.

    Raises:
        ValueError: Nếu vi phạm ràng buộc nào đó.
    """
    # Kiểm tra listing tồn tại
    result = await db.execute(select(Listing).where(Listing.id == obj_in.listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise ValueError("Listing not found")

    # Ràng buộc 1: Buyer không được là Seller của listing
    if listing.seller_id == buyer_id:
        raise ValueError("You cannot make an offer on your own listing")

    # Ràng buộc 2: Listing phải ACTIVE
    if listing.status != ListingStatus.ACTIVE:
        raise ValueError(f"Cannot make offer on listing with status: {listing.status}")

    # Ràng buộc 3: Listing phải negotiable
    if not listing.is_negotiable:
        raise ValueError("This listing is not negotiable")

    # Ràng buộc 4: Anti-spam check
    if await check_existing_pending_offer(db, buyer_id, obj_in.listing_id):
        raise ValueError("You already have a pending or countered offer on this listing")

    # Tạo offer mới
    db_obj = Offer(
        listing_id=obj_in.listing_id,
        buyer_id=buyer_id,
        offer_price=obj_in.offer_price,
        status=OfferStatus.PENDING
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def get_user_sent_offers(db: AsyncSession, buyer_id: uuid.UUID, skip: int = 0, limit: int = 10):
    """
    Lấy danh sách offer mà Buyer đã gửi đi (dành cho Buyer quản lý).
    """
    result = await db.execute(
        select(Offer).where(Offer.buyer_id == buyer_id)
        .order_by(Offer.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_seller_received_offers(db: AsyncSession, seller_id: uuid.UUID, skip: int = 0, limit: int = 10):
    """
    Lấy danh sách offer mà Seller nhận được trên tất cả các tin đăng của mình.
    Join với Listing để lọc theo seller_id.
    """
    result = await db.execute(
        select(Offer).join(Listing).where(Listing.seller_id == seller_id)
        .order_by(Offer.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_offers_by_listing(db: AsyncSession, listing_id: uuid.UUID, skip: int = 0, limit: int = 10):
    """
    Lấy toàn bộ offer cho 1 listing cụ thể.
    (Sẽ được kiểm tra quyền ở layer API - chỉ Seller mới xem được)
    """
    result = await db.execute(
        select(Offer).where(Offer.listing_id == listing_id)
        .order_by(Offer.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_offer_by_id(db: AsyncSession, offer_id: uuid.UUID) -> Offer | None:
    """Lấy offer theo ID."""
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    return result.scalar_one_or_none()


async def get_offer_with_lock(db: AsyncSession, offer_id: uuid.UUID) -> Offer | None:
    """Lấy offer với SELECT FOR UPDATE để lock row."""
    result = await db.execute(
        select(Offer)
        .where(Offer.id == offer_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def get_listing_with_lock(db: AsyncSession, listing_id: uuid.UUID) -> Listing | None:
    """Lấy listing với SELECT FOR UPDATE để lock row."""
    result = await db.execute(
        select(Listing)
        .where(Listing.id == listing_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def update_offer_status(db: AsyncSession, offer_id: uuid.UUID, obj_in: OfferStatusUpdate) -> Offer:
    """
    Cập nhật trạng thái offer (COUNTER, REJECT).
    Không xử lý ACCEPT ở đây - dùng accept_offer_with_order() thay thế.
    """
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise ValueError("Offer not found")

    # Cập nhật status
    offer.status = obj_in.status
    offer.updated_at = _utc_now_naive()

    # Counter offer can update the negotiated price.
    if obj_in.status == OfferStatus.COUNTERED and obj_in.offer_price is not None:
        offer.offer_price = obj_in.offer_price

    db.add(offer)
    return offer


async def accept_offer_with_order(
    db: AsyncSession,
    offer_id: uuid.UUID,
    user_id: uuid.UUID
) -> tuple[Offer, Order, Listing]:
    """
    Accept offer với race condition protection.
    Sử dụng SELECT FOR UPDATE để lock cả offer và listing.

    Returns:
        Tuple[Offer, Order, Listing]: Offer đã accept, Order mới tạo, Listing đã update

    Raises:
        ValueError: Nếu không thể accept offer
    """
    # Lock offer trước
    offer = await get_offer_with_lock(db, offer_id)
    if not offer:
        raise ValueError("Offer not found")

    # Check offer status
    if offer.status in {OfferStatus.ACCEPTED, OfferStatus.REJECTED, OfferStatus.EXPIRED}:
        raise ValueError(f"Cannot accept offer in terminal status: {offer.status}")

    # Lock listing
    listing = await get_listing_with_lock(db, offer.listing_id)
    if not listing:
        raise ValueError("Listing not found")

    # Check listing status - phải là ACTIVE
    if listing.status != ListingStatus.ACTIVE:
        raise ValueError(f"Cannot accept offer on listing with status: {listing.status}")

    # Kiểm tra quyền
    is_seller = listing.seller_id == user_id
    is_buyer = offer.buyer_id == user_id

    if not is_seller and not is_buyer:
        raise ValueError("You don't have permission to accept this offer")

    # Seller chỉ được accept PENDING offers
    if is_seller and offer.status != OfferStatus.PENDING:
        raise ValueError(f"Seller can only accept PENDING offers. Current: {offer.status}")

    # Buyer chỉ được accept COUNTERED offers
    if is_buyer and offer.status != OfferStatus.COUNTERED:
        raise ValueError(f"Buyer can only accept COUNTERED offers. Current: {offer.status}")

    # Update offer status
    offer.status = OfferStatus.ACCEPTED
    offer.updated_at = _utc_now_naive()

    # Tạo order
    order = Order(
        buyer_id=offer.buyer_id,
        seller_id=listing.seller_id,
        listing_id=offer.listing_id,
        final_price=offer.offer_price,
        status=OrderStatus.PENDING
    )
    db.add(order)

    # Update listing status
    listing.status = ListingStatus.SOLD

    # Reject tất cả offers PENDING và COUNTERED khác trên listing này
    await db.execute(
        update(Offer)
        .where(
            and_(
                Offer.listing_id == offer.listing_id,
                Offer.id != offer.id,
                Offer.status.in_([OfferStatus.PENDING, OfferStatus.COUNTERED])
            )
        )
        .values(status=OfferStatus.REJECTED, updated_at=_utc_now_naive())
    )

    await db.commit()
    await db.refresh(offer)
    await db.refresh(order)
    await db.refresh(listing)

    return offer, order, listing
