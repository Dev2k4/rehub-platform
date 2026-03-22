import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.crud import crud_listing, crud_notification, crud_order, crud_user
from app.models.enums import ListingStatus, OrderStatus, NotificationType
from app.models.user import User
from app.schemas.order import OrderDirectCreate, OrderRead
from app.services.email_service import send_order_created_email, send_order_completed_email

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_direct_order(
	data: OrderDirectCreate,
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	"""Buy Now endpoint"""
	listing = await crud_listing.get_listing(db, data.listing_id)
	if not listing:
		raise HTTPException(status_code=404, detail="Listing not found")
	if listing.status != ListingStatus.ACTIVE:
		raise HTTPException(status_code=400, detail="Listing is not available for purchase")
	if listing.seller_id == current_user.id:
		raise HTTPException(status_code=400, detail="Cannot buy your own listing")

	try:
		order, rejected_offers = await crud_order.create_direct_order(db, current_user.id, listing)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))

	# Send emails
	buyer = await crud_user.get_user_by_id(db, current_user.id)
	seller = await crud_user.get_user_by_id(db, listing.seller_id)
	if buyer and seller:
		await send_order_created_email(buyer=buyer, seller=seller, order=order, listing_title=listing.title)

	# Notify seller about new order
	await crud_notification.create_notification(
		db=db,
		user_id=listing.seller_id,
		type=NotificationType.ORDER_CREATED,
		title="New order created",
		message=f"A buyer placed an order for your listing '{listing.title}'.",
		data={"order_id": str(order.id), "listing_id": str(listing.id)},
	)

	# Notify buyer about order creation
	await crud_notification.create_notification(
		db=db,
		user_id=current_user.id,
		type=NotificationType.ORDER_CREATED,
		title="Order created",
		message=f"Your order for '{listing.title}' has been created successfully.",
		data={"order_id": str(order.id), "listing_id": str(listing.id)},
	)

	# Notify other buyers whose offers were rejected due to Buy Now
	for rejected_offer in rejected_offers:
		await crud_notification.create_notification(
			db=db,
			user_id=rejected_offer.buyer_id,
			type=NotificationType.OFFER_REJECTED,
			title="Offer rejected",
			message=f"Your offer for '{listing.title}' was rejected because the item was purchased by another buyer.",
			data={"offer_id": str(rejected_offer.id), "listing_id": str(listing.id)},
		)

	return order


@router.get("", response_model=list[OrderRead])
@router.get("/me", response_model=list[OrderRead])
async def get_my_orders(
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	"""Get current user's orders (as buyer or seller)."""
	return await crud_order.get_user_orders(db, current_user.id)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
	order_id: uuid.UUID,
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	order = await crud_order.get_order_by_id(db, order_id)
	if not order:
		raise HTTPException(status_code=404, detail="Order not found")

	if order.buyer_id != current_user.id and order.seller_id != current_user.id:
		raise HTTPException(status_code=403, detail="Not authorized")

	return order


@router.post("/{order_id}/complete", response_model=OrderRead)
async def complete_order(
	order_id: uuid.UUID,
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	order = await crud_order.get_order_by_id(db, order_id)
	if not order:
		raise HTTPException(status_code=404, detail="Order not found")

	if order.buyer_id != current_user.id:
		raise HTTPException(status_code=403, detail="Only buyer can complete the order")

	if order.status != OrderStatus.PENDING:
		raise HTTPException(status_code=400, detail=f"Cannot complete order in {order.status} state")

	updated_order = await crud_order.complete_order(db, order)
	buyer = await crud_user.get_user_by_id(db, order.buyer_id)
	seller = await crud_user.get_user_by_id(db, order.seller_id)
	if buyer and seller:
		await send_order_completed_email(buyer=buyer, seller=seller, order=updated_order)

	# Notify seller
	await crud_notification.create_notification(
		db=db,
		user_id=order.seller_id,
		type=NotificationType.ORDER_COMPLETED,
		title="Order completed",
		message="Buyer marked the order as completed.",
		data={"order_id": str(order.id), "listing_id": str(order.listing_id)},
	)

	# Notify buyer
	await crud_notification.create_notification(
		db=db,
		user_id=order.buyer_id,
		type=NotificationType.ORDER_COMPLETED,
		title="Order completed",
		message="Your order has been marked as completed.",
		data={"order_id": str(order.id), "listing_id": str(order.listing_id)},
	)

	return updated_order


@router.post("/{order_id}/cancel", response_model=OrderRead)
async def cancel_order(
	order_id: uuid.UUID,
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
	order = await crud_order.get_order_by_id(db, order_id)
	if not order:
		raise HTTPException(status_code=404, detail="Order not found")

	if order.buyer_id != current_user.id and order.seller_id != current_user.id:
		raise HTTPException(status_code=403, detail="Not authorized")

	if order.status != OrderStatus.PENDING:
		raise HTTPException(status_code=400, detail=f"Cannot cancel order in {order.status} state")

	updated_order = await crud_order.cancel_order(db, order)
	target_user_id = order.seller_id if current_user.id == order.buyer_id else order.buyer_id
	await crud_notification.create_notification(
		db=db,
		user_id=target_user_id,
		type=NotificationType.ORDER_CANCELLED,
		title="Order cancelled",
		message="The order was cancelled by the counterparty.",
		data={"order_id": str(order.id), "listing_id": str(order.listing_id)},
	)
	return updated_order
