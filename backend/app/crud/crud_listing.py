import uuid
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update, or_
from datetime import datetime, timezone

from app.models.listing import Listing, ListingImage
from app.models.enums import ListingStatus, ConditionGrade
from app.schemas.listing import ListingCreate, ListingUpdate

async def create_listing(db: AsyncSession, obj_in: ListingCreate, seller_id: str) -> Listing:
    db_obj = Listing(
        **obj_in.model_dump(),
        seller_id=uuid.UUID(seller_id),
        status=ListingStatus.PENDING # Default state until admin accepts it, configurable
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_listing(db: AsyncSession, listing_id: str) -> Optional[Listing]:
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    return result.scalar_one_or_none()

async def get_listing_images(db: AsyncSession, listing_id: str) -> List[ListingImage]:
    result = await db.execute(select(ListingImage).where(ListingImage.listing_id == listing_id))
    return list(result.scalars().all())

async def add_listing_image(db: AsyncSession, listing_id: str, image_url: str, is_primary: bool = False) -> ListingImage:
    # If this is the primary image, unfollow others
    if is_primary:
        await db.execute(
            update(ListingImage)
            .where(ListingImage.listing_id == listing_id)
            .values(is_primary=False)
        )
        
    db_img = ListingImage(
        listing_id=uuid.UUID(listing_id),
        image_url=image_url,
        is_primary=is_primary
    )
    db.add(db_img)
    await db.commit()
    await db.refresh(db_img)
    return db_img

async def update_listing(db: AsyncSession, listing_id: str, obj_in: ListingUpdate) -> Optional[Listing]:
    update_data = obj_in.model_dump(exclude_unset=True)
    if not update_data:
        return await get_listing(db, listing_id)
        
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.execute(
        update(Listing)
        .where(Listing.id == listing_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_listing(db, listing_id)

async def soft_delete_listing(db: AsyncSession, listing_id: str) -> None:
    await db.execute(
        update(Listing)
        .where(Listing.id == listing_id)
        .values(status=ListingStatus.HIDDEN, updated_at=datetime.now(timezone.utc))
    )
    await db.commit()

async def search_listings(
    db: AsyncSession,
    keyword: Optional[str] = None,
    category_id: Optional[str] = None,
    seller_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status: ListingStatus = ListingStatus.ACTIVE,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Listing], int]:
    
    query = select(Listing)
    count_query = select(func.count()).select_from(Listing)
    
    conditions = []
    
    if status:
        conditions.append(Listing.status == status)
    if keyword:
        conditions.append(Listing.title.ilike(f"%{keyword}%"))
    if category_id:
        conditions.append(Listing.category_id == category_id)
    if seller_id:
        conditions.append(Listing.seller_id == seller_id)
    if min_price is not None:
        conditions.append(Listing.price >= min_price)
    if max_price is not None:
        conditions.append(Listing.price <= max_price)
        
    if conditions:
        for condition in conditions:
            query = query.where(condition)
            count_query = count_query.where(condition)
            
    # Execute count
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    
    # Execute query
    query = query.order_by(Listing.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())
    
    return items, total

from sqlalchemy import delete

async def get_listing_image(db: AsyncSession, image_id: str) -> Optional[ListingImage]:
    result = await db.execute(select(ListingImage).where(ListingImage.id == image_id))
    return result.scalar_one_or_none()

async def delete_listing_image(db: AsyncSession, image_id: str) -> None:
    await db.execute(delete(ListingImage).where(ListingImage.id == image_id))
    await db.commit()


