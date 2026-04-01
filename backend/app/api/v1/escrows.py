import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_current_user, get_db
from app.crud import crud_escrow, crud_notification, crud_order, crud_wallet
from app.models.enums import NotificationType
from app.models.user import User
from app.schemas.escrow import EscrowAdminResolveRequest, EscrowDisputeRequest, EscrowRead
from app.schemas.wallet import WalletAccountRead
from app.services.websocket_manager import connection_manager

router = APIRouter(prefix="/escrows", tags=["Escrows"])
logger = logging.getLogger(__name__)


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


@router.get("/disputed", response_model=list[EscrowRead])
async def list_disputed_escrows(
    admin_user: Annotated[User, Depends(get_current_admin)],
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    # Touch admin_user to satisfy linters and keep explicit admin guard.
    _ = admin_user.id
    return await crud_escrow.list_disputed_escrows(db, skip=skip, limit=limit)


@router.get("/{order_id}", response_model=EscrowRead)
async def get_escrow_by_order(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    escrow = await crud_escrow.get_escrow_by_order_id(db, order_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    return escrow


@router.post("/{order_id}/fund", response_model=EscrowRead)
async def fund_escrow(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        escrow = await crud_escrow.fund_escrow(db, order, current_user.id)
        await crud_notification.create_notification(
            db=db,
            user_id=order.seller_id,
            type=NotificationType.ESCROW_FUNDED,
            title="Escrow funded",
            message="Buyer funded escrow. You can proceed to delivery.",
            data={"order_id": str(order.id)},
        )
        await _broadcast_escrow_event(escrow, "escrow:state_changed")
        await _broadcast_wallet_balance(db, order.buyer_id)
        await _broadcast_wallet_balance(db, order.seller_id)
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/release-request", response_model=EscrowRead)
async def request_release(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        escrow = await crud_escrow.request_release(db, order_id, current_user.id)
        await crud_notification.create_notification(
            db=db,
            user_id=order.buyer_id,
            type=NotificationType.ESCROW_RELEASE_REQUESTED,
            title="Delivery marked",
            message="Seller marked this order as delivered. Please confirm receipt.",
            data={"order_id": str(order.id)},
        )
        await _broadcast_escrow_event(escrow, "escrow:state_changed")
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/confirm-release", response_model=EscrowRead)
async def confirm_release(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        escrow = await crud_escrow.confirm_release(db, order_id, current_user.id)
        await crud_notification.create_notification(
            db=db,
            user_id=order.seller_id,
            type=NotificationType.ESCROW_RELEASED,
            title="Escrow released",
            message="Buyer confirmed delivery. Funds were released to your demo wallet.",
            data={"order_id": str(order.id)},
        )
        await _broadcast_escrow_event(escrow, "escrow:state_changed")
        await _broadcast_wallet_balance(db, order.buyer_id)
        await _broadcast_wallet_balance(db, order.seller_id)
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/open-dispute", response_model=EscrowRead)
async def open_dispute(
    order_id: uuid.UUID,
    payload: EscrowDisputeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        escrow = await crud_escrow.open_dispute(db, order_id, current_user.id, payload.note)
        target_user_id = order.seller_id if current_user.id == order.buyer_id else order.buyer_id
        await crud_notification.create_notification(
            db=db,
            user_id=target_user_id,
            type=NotificationType.ESCROW_DISPUTED,
            title="Escrow disputed",
            message="A dispute has been opened for this order.",
            data={"order_id": str(order.id)},
        )
        await _broadcast_escrow_event(escrow, "escrow:state_changed")
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/admin-resolve", response_model=EscrowRead)
async def admin_resolve_escrow(
    order_id: uuid.UUID,
    payload: EscrowAdminResolveRequest,
    admin_user: Annotated[User, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    order = await crud_order.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        if payload.result == "release":
            escrow = await crud_escrow.admin_resolve_release(db, order_id, admin_user.id, payload.note)
            target_user_id = order.seller_id
        else:
            escrow = await crud_escrow.admin_resolve_refund(db, order_id, admin_user.id, payload.note)
            target_user_id = order.buyer_id

        await crud_notification.create_notification(
            db=db,
            user_id=target_user_id,
            type=NotificationType.ESCROW_RESOLVED,
            title="Escrow resolved",
            message=f"Admin resolved escrow with result: {payload.result}.",
            data={"order_id": str(order.id), "result": payload.result},
        )
        await _broadcast_escrow_event(escrow, "escrow:state_changed")
        await _broadcast_wallet_balance(db, order.buyer_id)
        await _broadcast_wallet_balance(db, order.seller_id)
        return escrow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
