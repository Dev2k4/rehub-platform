import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.crud import crud_notification
from app.crud.crud_listing import get_listing, get_pending_listings
from app.crud.crud_user import get_user_by_id, get_users_list, update_user_status
from app.models.enums import ListingStatus, NotificationType
from app.models.user import User
from app.schemas.listing import ListingRead
from app.schemas.user import UserMe, UserStatusUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserMe])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin only: List all users."""
    users = await get_users_list(db, skip=skip, limit=limit)
    return users


@router.patch("/users/{user_id}/status", response_model=UserMe)
async def update_user_account_status(
    user_id: uuid.UUID,
    status_data: UserStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin only: Ban or unban a user by toggling is_active."""
    # Prevent admin from banning themselves
    if str(user_id) == str(admin_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own status."
        )

    user = await get_user_by_id(db, str(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await update_user_status(db, str(user_id), status_data.is_active)
    return updated_user



@router.get("/listings/pending", response_model=list[ListingRead])
async def get_pending_listings_route(
    skip: int = 0,
    limit: int = 100,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin only: List all pending listings."""
    return await get_pending_listings(db, skip=skip, limit=limit)

@router.post("/listings/{listing_id}/approve", response_model=ListingRead)
async def approve_listing(
    listing_id: uuid.UUID,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin only: Approve a pending listing."""
    listing = await get_listing(db, str(listing_id))
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Chỉ approve listing đang PENDING
    if listing.status != ListingStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve listing with status '{listing.status}'. Only PENDING listings can be approved."
        )

    listing.status = ListingStatus.ACTIVE
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    await crud_notification.create_notification(
        db=db,
        user_id=listing.seller_id,
        type=NotificationType.LISTING_APPROVED,
        title="Listing approved",
        message=f"Your listing '{listing.title}' has been approved.",
        data={"listing_id": str(listing.id)},
    )
    return listing

@router.post("/listings/{listing_id}/reject", response_model=ListingRead)
async def reject_listing_route(
    listing_id: uuid.UUID,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin only: Reject a listing (PENDING or ACTIVE)."""
    listing = await get_listing(db, str(listing_id))
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Chỉ reject listing đang PENDING hoặc ACTIVE
    if listing.status not in {ListingStatus.PENDING, ListingStatus.ACTIVE}:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject listing with status '{listing.status}'. Only PENDING or ACTIVE listings can be rejected."
        )

    listing.status = ListingStatus.REJECTED
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    await crud_notification.create_notification(
        db=db,
        user_id=listing.seller_id,
        type=NotificationType.LISTING_REJECTED,
        title="Listing rejected",
        message=f"Your listing '{listing.title}' has been rejected.",
        data={"listing_id": str(listing.id)},
    )
    return listing
