from typing import Annotated, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.listing import Listing
from app.models.order import Order
from app.models.enums import OfferStatus, ListingStatus, OrderStatus, NotificationType
from app.schemas.offer import OfferCreate, OfferRead, OfferStatusUpdate
from app.crud import crud_notification, crud_offer

router = APIRouter(prefix="/offers", tags=["offers"])


@router.post("/", response_model=OfferRead, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_in: OfferCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """
    Buyer tạo một offer mới cho một listing.
    
    Constraints:
    - Buyer không được là seller của listing
    - Listing phải có status ACTIVE
    - Listing phải có is_negotiable = True
    - Buyer không được có offer PENDING/COUNTERED trên listing này
    """
    try:
        offer = await crud_offer.create_offer(db, offer_in, current_user.id)

        result = await db.execute(select(Listing).where(Listing.id == offer.listing_id))
        listing = result.scalar_one_or_none()
        if listing:
            await crud_notification.create_notification(
                db=db,
                user_id=listing.seller_id,
                type=NotificationType.OFFER_RECEIVED,
                title="New offer received",
                message=f"You received a new offer for listing '{listing.title}'.",
                data={"offer_id": str(offer.id), "listing_id": str(listing.id)},
            )
        return offer
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me/sent", response_model=List[OfferRead])
async def get_my_sent_offers(
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """
    Buyer xem danh sách tất cả các offer mình đã gửi đi.
    """
    offers = await crud_offer.get_user_sent_offers(db, current_user.id, skip, limit)
    return offers


@router.get("/me/received", response_model=List[OfferRead])
async def get_my_received_offers(
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """
    Seller xem danh sách tất cả các offer nhận được trên các tin đăng của mình.
    """
    offers = await crud_offer.get_seller_received_offers(db, current_user.id, skip, limit)
    return offers


@router.get("/listing/{listing_id}", response_model=List[OfferRead])
async def get_offers_for_listing(
    listing_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """
    Seller xem danh sách offer cho một listing cụ thể.
    Chỉ Seller của listing mới được xem.
    """
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view offers for this listing"
        )
    
    offers = await crud_offer.get_offers_by_listing(db, listing_id, skip, limit)
    return offers


@router.patch("/{offer_id}/status", response_model=OfferRead)
async def update_offer_status(
    offer_id: uuid.UUID,
    status_update: OfferStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """
    Cập nhật trạng thái của offer.
    
    Permission Logic:
    - Seller (của listing) có thể: ACCEPT, REJECT, COUNTER offer từ PENDING
    - Buyer (người tạo offer) có thể: ACCEPT counter offer, REJECT offer của seller
    - Khi ACCEPT: Tự động REJECT các offer PENDING khác trên listing, và tạo Order
    
    Status transitions:
    - PENDING → ACCEPTED/REJECTED/COUNTERED (Seller only)
    - COUNTERED → ACCEPTED/REJECTED (Buyer only)
    """
    offer = await crud_offer.get_offer_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Lấy listing info
    result = await db.execute(select(Listing).where(Listing.id == offer.listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Kiểm tra quyền
    is_seller = listing.seller_id == current_user.id
    is_buyer = offer.buyer_id == current_user.id
    
    if not is_seller and not is_buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this offer"
        )

    # Do not allow changing completed terminal states.
    if offer.status in {OfferStatus.ACCEPTED, OfferStatus.REJECTED, OfferStatus.EXPIRED}:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change offer in terminal status: {offer.status}"
        )
    
    # Seller: chỉ được thay đổi PENDING offer
    if is_seller and offer.status != OfferStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Seller can only update PENDING offers. Current status: {offer.status}"
        )

    if is_seller and status_update.status not in {
        OfferStatus.ACCEPTED,
        OfferStatus.REJECTED,
        OfferStatus.COUNTERED,
    }:
        raise HTTPException(status_code=400, detail="Seller can only set ACCEPTED/REJECTED/COUNTERED")

    if is_seller and status_update.status == OfferStatus.COUNTERED and status_update.offer_price is None:
        raise HTTPException(status_code=400, detail="Countered status requires offer_price")
    
    # Buyer: có thể cancel offer PENDING của mình, hoặc respond COUNTERED offers
    if is_buyer:
        # Buyer can cancel their own PENDING offer
        if offer.status == OfferStatus.PENDING:
            if status_update.status != OfferStatus.REJECTED:
                raise HTTPException(
                    status_code=400,
                    detail="Buyer can only cancel (REJECTED) their pending offer"
                )
        # Buyer can accept/reject countered offers
        elif offer.status == OfferStatus.COUNTERED:
            if status_update.status not in {OfferStatus.ACCEPTED, OfferStatus.REJECTED}:
                raise HTTPException(
                    status_code=400,
                    detail="Buyer can only set ACCEPTED/REJECTED for countered offer"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Buyer cannot update offer with status: {offer.status}"
            )

    if status_update.status == OfferStatus.ACCEPTED and listing.status == ListingStatus.SOLD:
        raise HTTPException(status_code=400, detail="Listing already sold")
    
    # Cập nhật status
    previous_status = offer.status
    updated_offer, rejected_offers = await crud_offer.update_offer_status(db, offer_id, status_update)

    # Nếu status là ACCEPTED, tạo Order tự động và cập nhật listing
    if status_update.status == OfferStatus.ACCEPTED:
        order = Order(
            buyer_id=offer.buyer_id,
            seller_id=listing.seller_id,
            listing_id=offer.listing_id,
            final_price=offer.offer_price,
            status=OrderStatus.PENDING
        )
        db.add(order)

        # Cập nhật listing status thành SOLD
        listing.status = ListingStatus.SOLD
        db.add(listing)

    await db.commit()
    await db.refresh(updated_offer)

    # Gửi notification cho các buyers khác bị auto-reject
    if rejected_offers:
        for rejected_offer in rejected_offers:
            await crud_notification.create_notification(
                db=db,
                user_id=rejected_offer.buyer_id,
                type=NotificationType.OFFER_REJECTED,
                title="Offer rejected",
                message=f"Your offer for '{listing.title}' was rejected because another offer was accepted.",
                data={"offer_id": str(rejected_offer.id), "listing_id": str(listing.id)},
            )

    # Gửi ORDER_CREATED notification khi accept offer tạo order
    if status_update.status == OfferStatus.ACCEPTED:
        # Notify buyer
        await crud_notification.create_notification(
            db=db,
            user_id=offer.buyer_id,
            type=NotificationType.ORDER_CREATED,
            title="Order created",
            message=f"Your offer for '{listing.title}' was accepted. Order has been created.",
            data={"listing_id": str(listing.id)},
        )
        # Notify seller
        await crud_notification.create_notification(
            db=db,
            user_id=listing.seller_id,
            type=NotificationType.ORDER_CREATED,
            title="Order created",
            message=f"You accepted an offer for '{listing.title}'. Order has been created.",
            data={"listing_id": str(listing.id)},
        )

    if status_update.status in {OfferStatus.ACCEPTED, OfferStatus.REJECTED, OfferStatus.COUNTERED}:
        notification_type = {
            OfferStatus.ACCEPTED: NotificationType.OFFER_ACCEPTED,
            OfferStatus.REJECTED: NotificationType.OFFER_REJECTED,
            OfferStatus.COUNTERED: NotificationType.OFFER_COUNTERED,
        }[status_update.status]

        if is_seller:
            target_user_id = offer.buyer_id
            message = f"Your offer for '{listing.title}' was updated to '{status_update.status}'."
        else:
            target_user_id = listing.seller_id
            message = f"Buyer responded to a counter offer for '{listing.title}' with '{status_update.status}'."

        await crud_notification.create_notification(
            db=db,
            user_id=target_user_id,
            type=notification_type,
            title="Offer status updated",
            message=message,
            data={"offer_id": str(offer.id), "listing_id": str(listing.id)},
        )

    if previous_status != OfferStatus.EXPIRED and updated_offer.status == OfferStatus.EXPIRED:
        await crud_notification.create_notification(
            db=db,
            user_id=offer.buyer_id,
            type=NotificationType.OFFER_EXPIRED,
            title="Offer expired",
            message="Your offer has expired due to timeout.",
            data={"offer_id": str(offer.id), "listing_id": str(listing.id)},
        )
    
    return updated_offer


@router.get("/{offer_id}", response_model=OfferRead)
async def get_offer(
    offer_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """
    Lấy chi tiết một offer.
    Chỉ Buyer/Seller của offer (hoặc listing) mới được xem.
    """
    offer = await crud_offer.get_offer_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    result = await db.execute(select(Listing).where(Listing.id == offer.listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Chỉ cho phép Buyer hoặc Seller xem
    if current_user.id != offer.buyer_id and current_user.id != listing.seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this offer"
        )
    
    return offer
