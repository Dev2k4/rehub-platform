import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.crud import crud_notification, crud_order, crud_review
from app.models.enums import OrderStatus, NotificationType
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
	data: ReviewCreate,
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	order = await crud_order.get_order_by_id(db, data.order_id)
	if not order:
		raise HTTPException(status_code=404, detail="Order not found")

	if order.status != OrderStatus.COMPLETED:
		raise HTTPException(status_code=400, detail="Cannot review an incomplete order")

	if order.buyer_id != current_user.id and order.seller_id != current_user.id:
		raise HTTPException(status_code=403, detail="Not authorized to review this order")

	existing = await crud_review.get_review_by_order(db, data.order_id)
	if existing:
		raise HTTPException(status_code=400, detail="Review already exists for this order")

	# Determine reviewee: if current user is buyer, reviewee is seller, else buyer
	reviewee_id = order.seller_id if current_user.id == order.buyer_id else order.buyer_id

	review = await crud_review.create_review(
		db,
		order_id=data.order_id,
		reviewer_id=current_user.id,
		reviewee_id=reviewee_id,
		rating=data.rating,
		comment=data.comment
	)
	await crud_notification.create_notification(
		db=db,
		user_id=reviewee_id,
		type=NotificationType.REVIEW_RECEIVED,
		title="New review received",
		message="You received a new review from a completed order.",
		data={"order_id": str(data.order_id), "review_id": str(review.id)},
	)
	return review


@router.get("/user/{user_id}", response_model=list[ReviewRead])
async def get_user_reviews(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
	return await crud_review.get_user_reviews(db, user_id)


@router.get("/{order_id}", response_model=ReviewRead)
async def get_review(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
	review = await crud_review.get_review_by_order(db, order_id)
	if not review:
		raise HTTPException(status_code=404, detail="Review not found")
	return review
