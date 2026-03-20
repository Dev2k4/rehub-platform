import uuid
from typing import List, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_admin
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryRead, CategoryTree
from app.crud import crud_category

router = APIRouter(prefix="/categories", tags=["Categories"])
admin_categories_router = APIRouter(prefix="/admin/categories", tags=["Admin Categories"])

def build_category_tree(categories: List[Category]) -> List[dict]:
    """Helper function to build a tree from a flat list of categories."""
    category_map = {str(c.id): {"id": c.id, "name": c.name, "slug": c.slug, "parent_id": c.parent_id, "icon_url": c.icon_url, "created_at": c.created_at, "children": []} for c in categories}
    tree = []

    for c in categories:
        if c.parent_id:
            parent_id_str = str(c.parent_id)
            if parent_id_str in category_map:
                category_map[parent_id_str]["children"].append(category_map[str(c.id)])
        else:
            tree.append(category_map[str(c.id)])
            
    return tree

@router.get("/", response_model=Union[List[CategoryTree], List[CategoryRead]])
async def get_categories(
    as_tree: bool = Query(False, description="Format the response as a tree"),
    db: AsyncSession = Depends(get_db)
):
    """Get all categories. Pass as_tree=true to get a hierarchical tree."""
    categories = await crud_category.get_all_categories(db)
    if as_tree:
        return build_category_tree(categories)
    return categories

@router.get("/{category_id}", response_model=CategoryRead)
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific category by ID."""
    category = await crud_category.get_category_by_id(db, str(category_id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@admin_categories_router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def admin_create_category(
    data: CategoryCreate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin only: Create a new category (spec-aligned path)."""
    if data.parent_id:
        parent = await crud_category.get_category_by_id(db, str(data.parent_id))
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category does not exist")

    if data.slug:
        existing = await crud_category.get_category_by_slug(db, data.slug)
        if existing:
            raise HTTPException(status_code=409, detail="Category with this slug already exists")

    try:
        return await crud_category.create_category(db, data)
    except Exception:
        raise HTTPException(status_code=409, detail="Could not create category. Duplicate slug or name.")


@admin_categories_router.patch("/{category_id}", response_model=CategoryRead)
async def admin_update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin only: Update a category (spec-aligned path)."""
    category = await crud_category.get_category_by_id(db, str(category_id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if data.parent_id:
        if str(category_id) == str(data.parent_id):
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
        parent = await crud_category.get_category_by_id(db, str(data.parent_id))
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category does not exist")

    try:
        return await crud_category.update_category(db, str(category_id), data)
    except Exception:
        raise HTTPException(status_code=409, detail="Could not update category. Potential conflict.")


@admin_categories_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_category(
    category_id: uuid.UUID,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin only: Delete a category (spec-aligned path)."""
    category = await crud_category.get_category_by_id(db, str(category_id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    children = await crud_category.get_children_categories(db, str(category_id))
    if children:
        raise HTTPException(status_code=400, detail="Cannot delete category containing sub-categories.")

    await crud_category.delete_category(db, str(category_id))
    return None

