import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.crud import crud_notification, crud_order, crud_review
from app.models.enums import OrderStatus, NotificationType
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.user import UserPublicProfile
from app.crud.crud_user import get_user_by_id
from app.services.websocket_manager import connection_manager

router = APIRouter(prefix="/reviews", tags=["Reviews"])
logger = logging.getLogger(__name__)


async def _broadcast_review_created(review: ReviewRead) -> None:
	try:
		payload = ReviewRead.model_validate(review).model_dump(mode="json")
		event = {
			"type": "review:created",
			"data": {
				"review": payload,
			},
		}
		await connection_manager.send_to_user(review.reviewee_id, event)
		if review.reviewer_id != review.reviewee_id:
			await connection_manager.send_to_user(review.reviewer_id, event)
	except Exception:
		logger.exception("Failed to broadcast review:created")


async def _broadcast_user_rating_changed(db: AsyncSession, reviewee_id: uuid.UUID) -> None:
	try:
		user = await get_user_by_id(db, user_id=str(reviewee_id))
		if not user:
			return

		profile_payload = UserPublicProfile.model_validate(user).model_dump(mode="json")
		await connection_manager.send_to_user(
			reviewee_id,
			{
				"type": "user:rating_changed",
				"data": {
					"user_id": str(reviewee_id),
					"rating_avg": profile_payload.get("rating_avg"),
					"rating_count": profile_payload.get("rating_count"),
					"profile": profile_payload,
				},
			},
		)
	except Exception:
		logger.exception("Failed to broadcast user:rating_changed")


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

	# Check nếu user này đã review order chưa (cho phép cả buyer và seller review)
	existing = await crud_review.get_review_by_order_and_reviewer(db, data.order_id, current_user.id)
	if existing:
		raise HTTPException(status_code=400, detail="You have already reviewed this order")

	# Determine reviewee: if current user is buyer, reviewee is seller, else buyer
	reviewee_id = order.seller_id if current_user.id == order.buyer_id else order.buyer_id

	if reviewee_id == current_user.id:
		raise HTTPException(status_code=400, detail="Cannot review yourself")

	try:
		review = await crud_review.create_review(
			db,
			order_id=data.order_id,
			reviewer_id=current_user.id,
			reviewee_id=reviewee_id,
			rating=data.rating,
			comment=data.comment
		)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))

	await crud_notification.create_notification(
		db=db,
		user_id=reviewee_id,
		type=NotificationType.REVIEW_RECEIVED,
		title="New review received",
		message="You received a new review from a completed order.",
		data={"order_id": str(data.order_id), "review_id": str(review.id)},
	)
	await _broadcast_review_created(review)
	await _broadcast_user_rating_changed(db, reviewee_id)
	return review


@router.get("/user/{user_id}", response_model=list[ReviewRead])
async def get_user_reviews(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
	return await crud_review.get_user_reviews(db, user_id)


@router.get("/{order_id}", response_model=list[ReviewRead])
async def get_reviews_for_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
	"""Lấy tất cả reviews cho 1 order (có thể có từ buyer và seller)."""
	reviews = await crud_review.get_reviews_by_order(db, order_id)
	return reviews
