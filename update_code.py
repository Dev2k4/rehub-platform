import os

CRUD_FILE = 'backend/app/crud/crud_listing.py'
API_FILE = 'backend/app/api/v1/listings.py'

# 1. Update crud_listing.py
with open(CRUD_FILE, 'r', encoding='utf-8') as f:
    crud_content = f.read()

crud_old_1 = '''async def search_listings(
    db: AsyncSession,
    keyword: Optional[str] = None,
    category_id: Optional[str] = None,
    min_price: Optional[float] = None,'''
crud_new_1 = '''async def search_listings(
    db: AsyncSession,
    keyword: Optional[str] = None,
    category_id: Optional[str] = None,
    seller_id: Optional[str] = None,
    min_price: Optional[float] = None,'''
crud_content = crud_content.replace(crud_old_1, crud_new_1)

crud_old_2 = '''    if category_id:
        conditions.append(Listing.category_id == category_id)
    if min_price is not None:'''
crud_new_2 = '''    if category_id:
        conditions.append(Listing.category_id == category_id)
    if seller_id:
        conditions.append(Listing.seller_id == seller_id)
    if min_price is not None:'''
crud_content = crud_content.replace(crud_old_2, crud_new_2)

crud_old_3 = '''    return items, total'''
crud_new_3 = '''    return items, total

from sqlalchemy import delete

async def get_listing_image(db: AsyncSession, image_id: str) -> Optional[ListingImage]:
    result = await db.execute(select(ListingImage).where(ListingImage.id == image_id))
    return result.scalar_one_or_none()

async def delete_listing_image(db: AsyncSession, image_id: str) -> None:
    await db.execute(delete(ListingImage).where(ListingImage.id == image_id))
    await db.commit()
'''
crud_content = crud_content.replace(crud_old_3, crud_new_3)

with open(CRUD_FILE, 'w', encoding='utf-8') as f:
    f.write(crud_content)

# 2. Update v1/listings.py
with open(API_FILE, 'r', encoding='utf-8') as f:
    api_content = f.read()

api_old_1 = '''@router.get("/", response_model=ListingPaginated)
async def list_listings(
    keyword: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    status: ListingStatus = Query(ListingStatus.ACTIVE, description="Filter by status (default is active)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    \"\"\"Get heavily filtered and paginated listings, along with their images.\"\"\"
    cat_id_str = str(category_id) if category_id else None
    items, total = await crud_listing.search_listings(
        db,
        keyword=keyword,
        category_id=cat_id_str,
        min_price=min_price,
        max_price=max_price,
        status=status,
        skip=skip,
        limit=limit
    )'''

api_new_1 = '''@router.get("/", response_model=ListingPaginated)
async def list_listings(
    keyword: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    seller_id: Optional[uuid.UUID] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    \"\"\"Public Route: Get active filtered and paginated listings ONLY.\"\"\"
    cat_id_str = str(category_id) if category_id else None
    items, total = await crud_listing.search_listings(
        db, 
        keyword=keyword, 
        category_id=cat_id_str, 
        seller_id=str(seller_id) if seller_id else None,
        min_price=min_price, 
        max_price=max_price, 
        status=ListingStatus.ACTIVE, 
        skip=skip, 
        limit=limit
    )'''
api_content = api_content.replace(api_old_1, api_new_1)

api_old_2 = '''@router.get("/{listing_id}", response_model=ListingWithImages)'''

api_new_2 = '''@router.get("/me", response_model=ListingPaginated)
async def get_my_listings(
    keyword: Optional[str] = None,
    status: Optional[ListingStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    \"\"\"Get heavily filtered and paginated listings for current user.\"\"\"
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
    \"\"\"Requires JWT: Delete a listing image.\"\"\"
    image = await crud_listing.get_listing_image(db, str(image_id))
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    listing = await crud_listing.get_listing(db, str(image.listing_id))
    if str(listing.seller_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this image")
        
    await crud_listing.delete_listing_image(db, str(image_id))
    return None

@router.get("/{listing_id}", response_model=ListingWithImages)'''

api_content = api_content.replace(api_old_2, api_new_2)

with open(API_FILE, 'w', encoding='utf-8') as f:
    f.write(api_content)
    
print("Successfully modified listings endpoints and CRUD functions!")
