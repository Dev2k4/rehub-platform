import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from app.models.offer import Offer
from app.models.listing import Listing
from app.models.enums import OfferStatus, ListingStatus
from app.schemas.offer import OfferCreate, OfferStatusUpdate


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
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_offer_by_id(db: AsyncSession, offer_id: uuid.UUID) -> Offer:
    """Lấy offer theo ID."""
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    return result.scalar_one_or_none()
    
async def update_offer_status(db: AsyncSession, offer_id: uuid.UUID, obj_in: OfferStatusUpdate) -> Offer:
    """
    Cập nhật trạng thái offer.
    Logic:
    - Seller có thể chuyển từ PENDING sang: ACCEPTED, REJECTED, COUNTERED
    - Buyer có thể chấp nhận Counter (chuyển từ COUNTERED sang ACCEPTED)
    - Bất kỳ ai cũng có thể hủy bỏ (chuyển sang REJECTED)
    
    Khi ACCEPTED:
    - Tự động REJECT tất cả các offer PENDING khác trên cùng listing
    """
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise ValueError("Offer not found")
    
    old_status = offer.status
    new_status = obj_in.status
    
    # Cập nhật status
    offer.status = new_status
    
    # Nếu status chuyển sang ACCEPTED, tự động REJECT các offer PENDING khác
    if new_status == OfferStatus.ACCEPTED and old_status != OfferStatus.ACCEPTED:
        result = await db.execute(
            select(Offer).where(
                and_(
                    Offer.listing_id == offer.listing_id,
                    Offer.id != offer.id,
                    Offer.status == OfferStatus.PENDING
                )
            )
        )
        other_offers = list(result.scalars().all())
        for other_offer in other_offers:
            other_offer.status = OfferStatus.REJECTED
    
    db.add(offer)
    await db.commit()
    await db.refresh(offer)
    return offer
