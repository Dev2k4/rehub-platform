from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.crud import crud_wallet
from app.models.user import User
from app.schemas.wallet import (
    WalletAccountRead,
    WalletDemoTopupRequest,
    WalletTransactionRead,
)
from app.services.websocket_manager import connection_manager

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("/me", response_model=WalletAccountRead)
async def get_my_wallet(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    return await crud_wallet.get_or_create_wallet(db, current_user.id)


@router.post("/demo-topup", response_model=WalletAccountRead)
async def topup_demo_wallet(
    payload: WalletDemoTopupRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    try:
        wallet = await crud_wallet.topup_demo(db, current_user.id, payload.amount)
        wallet_payload = WalletAccountRead.model_validate(wallet).model_dump(mode="json")
        await connection_manager.send_to_user(
            current_user.id,
            {
                "type": "wallet:balance_updated",
                "data": {
                    "wallet": wallet_payload,
                },
            },
        )
        return wallet
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions", response_model=list[WalletTransactionRead])
async def get_my_wallet_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    return await crud_wallet.list_wallet_transactions(db, current_user.id)
