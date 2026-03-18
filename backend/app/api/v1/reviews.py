import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.schemas.review import ReviewRead
from app.crud import crud_review

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/{order_id}", response_model=ReviewRead)
async def get_review(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
	review = await crud_review.get_review_by_order(db, order_id)
	if not review:
		raise HTTPException(status_code=404, detail="Review not found")
	return review
