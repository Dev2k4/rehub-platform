from typing import Annotated, List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.listing import Listing
from app.models.enums import OfferStatus, NotificationType
from app.schemas.offer import OfferCreate, OfferRead, OfferStatusUpdate
from app.crud import crud_escrow, crud_notification, crud_offer
from app.services.websocket_manager import connection_manager

router = APIRouter(prefix="/offers", tags=["offers"])
logger = logging.getLogger(__name__)


async def _broadcast_offer_event(
    offer: OfferRead,
    seller_id: uuid.UUID,
    event_type: str,
) -> None:
    try:
        payload = OfferRead.model_validate(offer).model_dump(mode="json")
        event = {
            "type": event_type,
            "data": {
                "offer": payload,
                "seller_id": str(seller_id),
            },
        }
        await connection_manager.send_to_user(offer.buyer_id, event)
        if seller_id != offer.buyer_id:
            await connection_manager.send_to_user(seller_id, event)
    except Exception:
        logger.exception("Failed to broadcast offer event: %s", event_type)


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
            await _broadcast_offer_event(offer, listing.seller_id, "offer:status_changed")
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
    - Khi ACCEPT: Tự động REJECT các offer PENDING/COUNTERED khác trên listing, và tạo Order

    Status transitions:
    - PENDING → ACCEPTED/REJECTED/COUNTERED (Seller only)
    - COUNTERED → ACCEPTED/REJECTED (Buyer only)
    """
    # Nếu là ACCEPT, dùng hàm riêng với race condition protection
    if status_update.status == OfferStatus.ACCEPTED:
        try:
            offer, order, listing = await crud_offer.accept_offer_with_order(
                db, offer_id, current_user.id
            )
            await crud_escrow.create_escrow_for_order(db, order)

            # Gửi notification
            is_seller = listing.seller_id == current_user.id
            target_user_id = offer.buyer_id if is_seller else listing.seller_id

            if is_seller:
                message = f"Your offer for '{listing.title}' was accepted."
            else:
                message = f"Buyer accepted your counter offer for '{listing.title}'."

            await crud_notification.create_notification(
                db=db,
                user_id=target_user_id,
                type=NotificationType.OFFER_ACCEPTED,
                title="Offer accepted",
                message=message,
                data={"offer_id": str(offer.id), "listing_id": str(listing.id), "order_id": str(order.id)},
            )

            await crud_notification.create_notification(
                db=db,
                user_id=offer.buyer_id,
                type=NotificationType.ORDER_CREATED,
                title="Escrow pending funding",
                message="Order created with escrow. Please fund your demo wallet escrow to continue.",
                data={"order_id": str(order.id), "listing_id": str(listing.id), "action": "fund_escrow"},
            )

            await _broadcast_offer_event(offer, listing.seller_id, "offer:status_changed")

            return offer
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Xử lý REJECT và COUNTER bình thường
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

    if is_seller and status_update.status not in {OfferStatus.REJECTED, OfferStatus.COUNTERED}:
        raise HTTPException(status_code=400, detail="Seller can only set REJECTED/COUNTERED (use ACCEPTED separately)")

    if is_seller and status_update.status == OfferStatus.COUNTERED and status_update.offer_price is None:
        raise HTTPException(status_code=400, detail="Countered status requires offer_price")

    # Buyer: chỉ được reject COUNTERED offers (accept đã xử lý ở trên)
    if is_buyer and offer.status != OfferStatus.COUNTERED:
        raise HTTPException(
            status_code=400,
            detail=f"Buyer can only reject countered offers. Current status: {offer.status}"
        )

    if is_buyer and status_update.status != OfferStatus.REJECTED:
        raise HTTPException(status_code=400, detail="Buyer can only set REJECTED for countered offer (use ACCEPTED separately)")

    # Cập nhật status
    try:
        updated_offer = await crud_offer.update_offer_status(db, offer_id, status_update)
        await db.commit()
        await db.refresh(updated_offer)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Gửi notification
    notification_type = {
        OfferStatus.REJECTED: NotificationType.OFFER_REJECTED,
        OfferStatus.COUNTERED: NotificationType.OFFER_COUNTERED,
    }.get(status_update.status)

    if notification_type:
        if is_seller:
            target_user_id = offer.buyer_id
            message = f"Your offer for '{listing.title}' was {status_update.status.value}."
        else:
            target_user_id = listing.seller_id
            message = f"Buyer rejected your counter offer for '{listing.title}'."

        await crud_notification.create_notification(
            db=db,
            user_id=target_user_id,
            type=notification_type,
            title="Offer status updated",
            message=message,
            data={"offer_id": str(offer.id), "listing_id": str(listing.id)},
        )

    await _broadcast_offer_event(updated_offer, listing.seller_id, "offer:status_changed")

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
