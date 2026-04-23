import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.crud import crud_escrow, crud_fulfillment, crud_notification, crud_order, crud_wallet
from app.models.enums import NotificationType
from app.models.user import User
from app.schemas.fulfillment import (
    FulfillmentBuyerConfirmRequest,
    FulfillmentMarkShippingRequest,
    FulfillmentMarkDeliveredRequest,
    FulfillmentRead,
)
from app.schemas.order import OrderRead
from app.schemas.escrow import EscrowRead
from app.schemas.wallet import WalletAccountRead
from app.services.websocket_manager import connection_manager

router = APIRouter(prefix="/fulfillments", tags=["Fulfillments"])
logger = logging.getLogger(__name__)


async def _broadcast_fulfillment_event(fulfillment: FulfillmentRead, event_type: str) -> None:
    try:
        payload = FulfillmentRead.model_validate(fulfillment).model_dump(mode="json")
        event = {
            "type": event_type,
            "data": {
                "fulfillment": payload,
            },
        }
        await connection_manager.send_to_user(fulfillment.buyer_id, event)
        if fulfillment.seller_id != fulfillment.buyer_id:
            await connection_manager.send_to_user(fulfillment.seller_id, event)
    except Exception:
        logger.exception("Failed to broadcast fulfillment event: %s", event_type)


async def _broadcast_order_event(order: OrderRead, event_type: str) -> None:
    try:
        payload = OrderRead.model_validate(order).model_dump(mode="json")
        event = {
            "type": event_type,
            "data": {
                "order": payload,
            },
        }
        await connection_manager.send_to_user(order.buyer_id, event)
        if order.seller_id != order.buyer_id:
            await connection_manager.send_to_user(order.seller_id, event)
    except Exception:
        logger.exception("Failed to broadcast order event: %s", event_type)


async def _broadcast_escrow_event(escrow: EscrowRead, event_type: str) -> None:
    try:
        payload = EscrowRead.model_validate(escrow).model_dump(mode="json")
        event = {
            "type": event_type,
            "data": {
                "escrow": payload,
            },
        }
        await connection_manager.send_to_user(escrow.buyer_id, event)
        if escrow.seller_id != escrow.buyer_id:
            await connection_manager.send_to_user(escrow.seller_id, event)
    except Exception:
        logger.exception("Failed to broadcast escrow event: %s", event_type)


async def _broadcast_wallet_balance(db: AsyncSession, user_id: uuid.UUID) -> None:
    try:
        wallet = await crud_wallet.get_or_create_wallet(db, user_id)
        payload = WalletAccountRead.model_validate(wallet).model_dump(mode="json")
        await connection_manager.send_to_user(
            user_id,
            {
                "type": "wallet:balance_updated",
                "data": {
                    "wallet": payload,
                },
            },
        )
    except Exception:
        logger.exception("Failed to broadcast wallet balance for user %s", user_id)


@router.get("/{order_id}", response_model=FulfillmentRead)
async def get_fulfillment_by_order(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    fulfillment = await crud_fulfillment.get_fulfillment_by_order_id(db, order_id)
    if not fulfillment:
        fulfillment = await crud_fulfillment.create_fulfillment_for_order(db, order)
    return fulfillment


@router.post("/{order_id}/start-preparing", response_model=FulfillmentRead)
async def start_preparing(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not await crud_fulfillment.get_fulfillment_by_order_id(db, order_id):
        await crud_fulfillment.create_fulfillment_for_order(db, order)

    try:
        fulfillment = await crud_fulfillment.seller_start_preparing(db, order_id, current_user.id)
        await crud_notification.create_notification(
            db=db,
            user_id=order.buyer_id,
            type=NotificationType.ORDER_CREATED,
            title="Order status updated",
            message="Seller updated order status: preparing package.",
            data={"order_id": str(order.id), "status": "preparing"},
        )
        updated_order = await crud_order.get_order_by_id(db, order_id)
        if updated_order:
            await _broadcast_order_event(updated_order, "order:status_changed")
        await _broadcast_fulfillment_event(fulfillment, "fulfillment:state_changed")
        return fulfillment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/start-delivery", response_model=FulfillmentRead)
async def start_delivery_alias(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    return await start_preparing(order_id=order_id, current_user=current_user, db=db)


@router.post("/{order_id}/mark-shipping", response_model=FulfillmentRead)
async def mark_shipping(
    order_id: uuid.UUID,
    payload: FulfillmentMarkShippingRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not await crud_fulfillment.get_fulfillment_by_order_id(db, order_id):
        await crud_fulfillment.create_fulfillment_for_order(db, order)

    try:
        fulfillment = await crud_fulfillment.seller_mark_shipping(
            db=db,
            order_id=order_id,
            seller_id=current_user.id,
            note=payload.note,
        )
        await crud_notification.create_notification(
            db=db,
            user_id=order.buyer_id,
            type=NotificationType.ORDER_CREATED,
            title="Order status updated",
            message="Seller updated order status: shipping in progress.",
            data={"order_id": str(order.id), "status": "in_delivery"},
        )
        updated_order = await crud_order.get_order_by_id(db, order_id)
        if updated_order:
            await _broadcast_order_event(updated_order, "order:status_changed")
        await _broadcast_fulfillment_event(fulfillment, "fulfillment:state_changed")
        return fulfillment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/mark-delivered", response_model=FulfillmentRead)
async def mark_delivered(
    order_id: uuid.UUID,
    payload: FulfillmentMarkDeliveredRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not await crud_fulfillment.get_fulfillment_by_order_id(db, order_id):
        await crud_fulfillment.create_fulfillment_for_order(db, order)

    try:
        fulfillment = await crud_fulfillment.seller_mark_delivered(
            db=db,
            order_id=order_id,
            seller_id=current_user.id,
            proof_image_urls=payload.proof_image_urls,
            note=payload.note,
        )
        await crud_notification.create_notification(
            db=db,
            user_id=order.buyer_id,
            type=NotificationType.ESCROW_RELEASE_REQUESTED,
            title="Delivery marked",
            message="Seller marked this order as delivered. Please confirm receipt.",
            data={"order_id": str(order.id), "status": "delivered"},
        )
        updated_order = await crud_order.get_order_by_id(db, order_id)
        if updated_order:
            await _broadcast_order_event(updated_order, "order:status_changed")
        escrow = await crud_escrow.get_escrow_by_order_id(db, order_id)
        if escrow:
            await _broadcast_escrow_event(escrow, "escrow:state_changed")
        await _broadcast_fulfillment_event(fulfillment, "fulfillment:state_changed")
        return fulfillment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/buyer-confirm", response_model=FulfillmentRead)
async def buyer_confirm_received(
    order_id: uuid.UUID,
    payload: FulfillmentBuyerConfirmRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not await crud_fulfillment.get_fulfillment_by_order_id(db, order_id):
        await crud_fulfillment.create_fulfillment_for_order(db, order)

    try:
        fulfillment = await crud_fulfillment.buyer_confirm_received(
            db=db,
            order_id=order_id,
            buyer_id=current_user.id,
            proof_image_urls=payload.proof_image_urls,
            note=payload.note,
        )
        await crud_notification.create_notification(
            db=db,
            user_id=order.seller_id,
            type=NotificationType.ESCROW_RELEASED,
            title="Escrow released",
            message="Buyer confirmed delivery. Funds were released to your demo wallet.",
            data={"order_id": str(order.id)},
        )
        updated_order = await crud_order.get_order_by_id(db, order_id)
        if updated_order:
            await _broadcast_order_event(updated_order, "order:status_changed")
        escrow = await crud_escrow.get_escrow_by_order_id(db, order_id)
        if escrow:
            await _broadcast_escrow_event(escrow, "escrow:state_changed")
        await _broadcast_wallet_balance(db, order.buyer_id)
        await _broadcast_wallet_balance(db, order.seller_id)
        await _broadcast_fulfillment_event(fulfillment, "fulfillment:state_changed")
        return fulfillment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
