import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, delete, func, or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.enums import ConditionGrade, ListingStatus
from app.models.listing import Listing, ListingImage
from app.models.user import User
from app.schemas.listing import ListingCreate, ListingUpdate


def _utc_now_naive() -> datetime:
    """Return naive UTC datetime (compatible with 'timestamp without time zone')."""
    return datetime.now(timezone.utc).replace(tzinfo=None).replace(tzinfo=None)


def _to_uuid(value: str | uuid.UUID) -> uuid.UUID:
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))


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

async def get_listing(db: AsyncSession, listing_id: str) -> Listing | None:
    result = await db.execute(select(Listing).where(Listing.id == _to_uuid(listing_id)))
    return result.scalar_one_or_none()

async def get_listing_images(db: AsyncSession, listing_id: str) -> list[ListingImage]:
    result = await db.execute(select(ListingImage).where(ListingImage.listing_id == _to_uuid(listing_id)))
    return list(result.scalars().all())

async def add_listing_image(
    db: AsyncSession,
    listing_id: str,
    image_url: str,
    thumbnail_url: str | None = None,
    perceptual_hash: str | None = None,
    image_md5: str | None = None,
    is_primary: bool = False,
) -> ListingImage:
    # If this is the primary image, unfollow others
    if is_primary:
        await db.execute(
            update(ListingImage)
            .where(ListingImage.listing_id == _to_uuid(listing_id))
            .values(is_primary=False)
        )

    db_img = ListingImage(
        listing_id=uuid.UUID(listing_id),
        image_url=image_url,
        thumbnail_url=thumbnail_url,
        perceptual_hash=perceptual_hash,
        image_md5=image_md5,
        is_primary=is_primary
    )
    db.add(db_img)
    await db.commit()
    await db.refresh(db_img)
    return db_img

async def update_listing(db: AsyncSession, listing_id: str, obj_in: ListingUpdate) -> Listing | None:
    update_data = obj_in.model_dump(exclude_unset=True)
    if not update_data:
        return await get_listing(db, listing_id)

    update_data["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.execute(
        update(Listing)
        .where(Listing.id == _to_uuid(listing_id))
        .values(**update_data)
    )
    await db.commit()
    return await get_listing(db, listing_id)

async def soft_delete_listing(db: AsyncSession, listing_id: str) -> None:
    await db.execute(
        update(Listing)
        .where(Listing.id == _to_uuid(listing_id))
        .values(status=ListingStatus.HIDDEN, updated_at=datetime.now(timezone.utc).replace(tzinfo=None))
    )
    await db.commit()

async def search_listings(
    db: AsyncSession,
    keyword: str | None = None,
    category_id: str | None = None,
    seller_id: str | None = None,
    condition_grade: ConditionGrade | None = None,
    province: str | None = None,
    district: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    status: ListingStatus | None = ListingStatus.ACTIVE,
    sort_by: str = "newest",
    skip: int = 0,
    limit: int = 100
) -> tuple[list[Listing], int]:

    query = select(Listing)
    count_query = select(func.count()).select_from(Listing)

    conditions = []

    if status:
        conditions.append(Listing.status == status)
    if keyword:
        # Keyword is matched on both title and description to improve recall.
        keyword_like = f"%{keyword.strip()}%"
        conditions.append(
            or_(
                Listing.title.ilike(keyword_like),
                Listing.description.ilike(keyword_like),
            )
        )
    if category_id:
        conditions.append(Listing.category_id == _to_uuid(category_id))
    if seller_id:
        conditions.append(Listing.seller_id == _to_uuid(seller_id))
    if condition_grade:
        conditions.append(Listing.condition_grade == condition_grade)
    if min_price is not None:
        conditions.append(Listing.price >= min_price)
    if max_price is not None:
        conditions.append(Listing.price <= max_price)

    if province:
        query = query.join(User, User.id == Listing.seller_id)
        count_query = count_query.join(User, User.id == Listing.seller_id)
        conditions.append(func.lower(User.province) == province.strip().lower())

    if district:
        if not province:
            query = query.join(User, User.id == Listing.seller_id)
            count_query = count_query.join(User, User.id == Listing.seller_id)
        conditions.append(func.lower(User.district) == district.strip().lower())

    if conditions:
        where_clause = and_(*conditions)
        query = query.where(where_clause)
        count_query = count_query.where(where_clause)

    # Execute count
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    # Execute query
    if sort_by == "price_asc":
        query = query.order_by(Listing.price.asc(), Listing.created_at.desc())
    elif sort_by == "price_desc":
        query = query.order_by(Listing.price.desc(), Listing.created_at.desc())
    else:
        query = query.order_by(Listing.created_at.desc())

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total



async def get_listing_image(db: AsyncSession, image_id: str) -> ListingImage | None:
    result = await db.execute(select(ListingImage).where(ListingImage.id == _to_uuid(image_id)))
    return result.scalar_one_or_none()

async def delete_listing_image(db: AsyncSession, image_id: str) -> None:
    await db.execute(delete(ListingImage).where(ListingImage.id == _to_uuid(image_id)))
    await db.commit()



async def get_pending_listings(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Listing]:
    result = await db.execute(
        select(Listing)
        .where(Listing.status == ListingStatus.PENDING)
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())
