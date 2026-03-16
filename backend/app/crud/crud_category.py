import re
import unicodedata
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from app.models.category import Category
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
    update_data = obj_in.model_dump(exclude_unset=True)
    if "name" in update_data and "slug" not in update_data:
        update_data["slug"] = generate_slug(update_data["name"])

    if update_data:
        await db.execute(
            update(Category)
            .where(Category.id == category_id)
            .values(**update_data)
        )
        await db.commit()

    return await get_category_by_id(db, category_id)

async def delete_category(db: AsyncSession, category_id: str):
    await db.execute(delete(Category).where(Category.id == category_id))
    await db.commit()

async def get_children_categories(db: AsyncSession, parent_id: str) -> List[Category]:
    result = await db.execute(select(Category).where(Category.parent_id == parent_id))
    return list(result.scalars().all())

