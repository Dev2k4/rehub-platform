import uuid
from typing import Optional
import logging
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_user, get_current_user_optional
from app.models.user import User
from app.models.enums import ConditionGrade, ListingStatus, UserRole
from app.schemas.listing import (
    ListingRead,
    ListingCreate,
    ListingUpdate,
    ListingWithImages,
    ListingPaginated,
    ListingImageRead
)
from app.crud import crud_listing
from app.services.storage_service import upload_listing_image as upload_to_object_storage, delete_listing_image as delete_from_object_storage
from app.services.websocket_manager import connection_manager

router = APIRouter(prefix="/listings", tags=["Listings"])
logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _broadcast_listing_event(listing: ListingRead, event_type: str) -> None:
    try:
        payload = ListingRead.model_validate(listing).model_dump(mode="json")
        await connection_manager.send_to_user(
            listing.seller_id,
            {
                "type": event_type,
                "data": {
                    "listing": payload,
                },
            },
        )

        await connection_manager.broadcast(
            {
                "type": "listing:status_updated",
                "data": {
                    "listing_id": str(listing.id),
                    "status": listing.status.value,
                },
            }
        )
    except Exception:
        logger.exception("Failed to broadcast listing event: %s", event_type)

@router.get("", response_model=ListingPaginated, include_in_schema=False)
@router.get("/", response_model=ListingPaginated)
async def list_listings(
    keyword: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    seller_id: Optional[uuid.UUID] = None,
    condition_grade: Optional[ConditionGrade] = None,
    province: Optional[str] = Query(None, max_length=100),
    district: Optional[str] = Query(None, max_length=100),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: Literal["newest", "price_asc", "price_desc"] = Query("newest"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Public Route: Get active filtered and paginated listings ONLY."""
    cat_id_str = str(category_id) if category_id else None
    items, total = await crud_listing.search_listings(
        db, 
        keyword=keyword, 
        category_id=cat_id_str, 
        seller_id=str(seller_id) if seller_id else None,
        condition_grade=condition_grade,
        province=province,
        district=district,
        min_price=min_price, 
        max_price=max_price, 
        sort_by=sort_by,
        status=ListingStatus.ACTIVE, 
        skip=skip, 
        limit=limit
    )
    
    # We populate the images for each listing.
    listings_with_images = []
    for item in items:
        images = await crud_listing.get_listing_images(db, str(item.id))
        listing_dict = item.model_dump()
        listing_dict["images"] = images
        listings_with_images.append(ListingWithImages(**listing_dict))

    return ListingPaginated(
        items=listings_with_images,
        total=total,
        page=(skip // limit) + 1,
        size=limit
    )

@router.get("/me", response_model=ListingPaginated)
async def get_my_listings(
    keyword: Optional[str] = None,
    status: Optional[ListingStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get heavily filtered and paginated listings for current user."""
    items, total = await crud_listing.search_listings(
        db, 
        keyword=keyword, 
        seller_id=str(current_user.id),
        status=status,
        skip=skip, 
        limit=limit
    )
    
    listings_with_images = []
    for item in items:
        images = await crud_listing.get_listing_images(db, str(item.id))
        listing_dict = item.model_dump()
        listing_dict["images"] = images
        listings_with_images.append(ListingWithImages(**listing_dict))

    return ListingPaginated(
        items=listings_with_images,
        total=total,
        page=(skip // limit) + 1,
        size=limit
    )

@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing_image_route(
    image_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Requires JWT: Delete a listing image."""
    image = await crud_listing.get_listing_image(db, str(image_id))
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    listing = await crud_listing.get_listing(db, str(image.listing_id))
    if str(listing.seller_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this image")

    delete_from_object_storage(image.image_url)
        
    await crud_listing.delete_listing_image(db, str(image_id))
    return None

@router.get("/{listing_id}", response_model=ListingWithImages)
async def get_listing(
    listing_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific listing along with its full details and images.

    Access rules:
    - ACTIVE listings: anyone can view
    - PENDING/HIDDEN/REJECTED listings: only seller or admin can view
    - SOLD listings: anyone can view (as reference)
    """
    item = await crud_listing.get_listing(db, str(listing_id))
    if not item:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Check access permission based on status
    can_view = False
    if item.status in {ListingStatus.ACTIVE, ListingStatus.SOLD}:
        # Public listings - anyone can view
        can_view = True
    elif current_user:
        # Private listings - only seller or admin can view
        if str(item.seller_id) == str(current_user.id) or current_user.role == UserRole.ADMIN:
            can_view = True

    if not can_view:
        raise HTTPException(status_code=404, detail="Listing not found")

    images = await crud_listing.get_listing_images(db, str(item.id))

    listing_dict = item.model_dump()
    listing_dict["images"] = images
    return ListingWithImages(**listing_dict)

@router.post("", response_model=ListingRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=ListingRead, status_code=status.HTTP_201_CREATED)
async def create_listing(
    data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Requires JWT: Create a new listing. Status default to PENDING."""
    new_listing = await crud_listing.create_listing(db, data, str(current_user.id))
    await _broadcast_listing_event(new_listing, "listing:created")
    return new_listing

@router.patch("/{listing_id}", response_model=ListingRead)
async def update_listing(
    listing_id: uuid.UUID,
    data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Requires JWT: Update an existing listing. Only the seller or an Admin can fulfill this request."""
    listing = await crud_listing.get_listing(db, str(listing_id))
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    if str(listing.seller_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")

    if listing.status == ListingStatus.SOLD:
        raise HTTPException(status_code=400, detail="Cannot modify sold listing")
        
    if data.status is not None and current_user.role != UserRole.ADMIN:
        if data.status != ListingStatus.HIDDEN:
            raise HTTPException(status_code=403, detail="Only admins can approve/alter statuses besides hiding.")
            
    updated_listing = await crud_listing.update_listing(db, str(listing_id), data)
    if updated_listing is not None:
        await _broadcast_listing_event(updated_listing, "listing:updated")
    return updated_listing

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Requires JWT: Soft-delete a listing (by hiding it). Authorized for seller and admin."""
    listing = await crud_listing.get_listing(db, str(listing_id))
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    if str(listing.seller_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")

    if listing.status == ListingStatus.SOLD:
        raise HTTPException(status_code=400, detail="Cannot delete sold listing")
        
    await crud_listing.soft_delete_listing(db, str(listing_id))
    hidden_listing = await crud_listing.get_listing(db, str(listing_id))
    if hidden_listing is not None:
        await _broadcast_listing_event(hidden_listing, "listing:hidden")
    return None

@router.post("/{listing_id}/images", response_model=ListingImageRead)
async def upload_listing_image(
    listing_id: uuid.UUID,
    file: UploadFile = File(...),
    is_primary: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload an image to object storage and map it to a listing target."""
    listing = await crud_listing.get_listing(db, str(listing_id))
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    if str(listing.seller_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to add images")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="Invalid file name")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        image_url = upload_to_object_storage(
            file_bytes=file_bytes,
            ext=ext,
            content_type=file.content_type,
            user_id=str(listing.seller_id),
            listing_id=str(listing.id),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    new_image = await crud_listing.add_listing_image(db, str(listing_id), image_url, is_primary)
    return new_image

