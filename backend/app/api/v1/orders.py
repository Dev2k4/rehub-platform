import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.order import OrderRead
from app.crud import crud_order

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/me", response_model=list[OrderRead])
async def get_my_orders(
	current_user: Annotated[User, Depends(get_current_user)],
	db: AsyncSession = Depends(get_db),
):
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
