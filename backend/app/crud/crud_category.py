import re
import unicodedata
import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, func
from app.models.category import Category
from app.models.listing import Listing
from app.schemas.category import CategoryCreate, CategoryUpdate


def generate_slug(text: str) -> str:
    # Normalize to ascii and remove accents
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    # Remove non-alphanumeric characters
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    # Replace spaces and multiple dashes with a single dash
    return re.sub(r"[-\s]+", "-", text)


async def get_category_by_id(db: AsyncSession, category_id: str) -> Optional[Category]:
    result = await db.execute(select(Category).where(Category.id == category_id))
    return result.scalar_one_or_none()


async def get_category_by_slug(db: AsyncSession, slug: str) -> Optional[Category]:
    result = await db.execute(select(Category).where(Category.slug == slug))
    return result.scalar_one_or_none()


async def get_all_categories(db: AsyncSession) -> List[Category]:
    result = await db.execute(select(Category))
    return list(result.scalars().all())


async def check_circular_parent(
    db: AsyncSession, category_id: uuid.UUID, new_parent_id: uuid.UUID
) -> bool:
    """
    Kiểm tra xem việc set parent_id mới có tạo circular reference không.
    Return True nếu có circular, False nếu không.

    Logic: Traverse từ new_parent lên đến root. Nếu gặp category_id -> circular.
    """
    visited = set()
    current_id = new_parent_id

    while current_id:
        if current_id in visited:
            # Already visited -> broken chain (shouldn't happen normally)
            return True
        if current_id == category_id:
            # Found the category we're trying to update -> circular!
            return True

        visited.add(current_id)

        # Get parent of current
        result = await db.execute(select(Category).where(Category.id == current_id))
        current_cat = result.scalar_one_or_none()
        if not current_cat:
            break
        current_id = current_cat.parent_id

    return False


async def count_listings_by_category(db: AsyncSession, category_id: str) -> int:
    """Đếm số listings đang sử dụng category này."""
    result = await db.execute(
        select(func.count(Listing.id)).where(Listing.category_id == category_id)
    )
    return result.scalar() or 0


async def create_category(db: AsyncSession, obj_in: CategoryCreate) -> Category:
    slug = obj_in.slug or generate_slug(obj_in.name)

    db_obj = Category(
        name=obj_in.name,
        slug=slug,
        parent_id=obj_in.parent_id,
        icon_url=obj_in.icon_url
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update_category(db: AsyncSession, category_id: str, obj_in: CategoryUpdate) -> Category:
    # Fetch the object first (ORM-style)
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        return None

    update_data = obj_in.model_dump(exclude_unset=True)
    if "name" in update_data and "slug" not in update_data:
        update_data["slug"] = generate_slug(update_data["name"])

    # Update attributes directly on the ORM object
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(db: AsyncSession, category_id: str):
    await db.execute(delete(Category).where(Category.id == category_id))
    await db.commit()


async def get_children_categories(db: AsyncSession, parent_id: str) -> List[Category]:
    result = await db.execute(select(Category).where(Category.parent_id == parent_id))
    return list(result.scalars().all())

