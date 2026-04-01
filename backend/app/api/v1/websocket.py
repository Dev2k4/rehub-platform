import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.crud.crud_user import get_user_by_id
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.services.websocket_manager import connection_manager

router = APIRouter()


def _extract_token(websocket: WebSocket) -> str | None:
    query_token = websocket.query_params.get("token")
    if query_token:
        return query_token

    auth_header = websocket.headers.get("authorization")
    if not auth_header:
        return None

    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


async def _resolve_user(token: str, db: AsyncSession) -> User | None:
    try:
        payload = decode_access_token(token)
    except JWTError:
        return None

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        return None

    user = await get_user_by_id(db, user_id=user_id)
    if user is None or not user.is_active:
        return None

    return user


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    token = _extract_token(websocket)
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing access token")
        return

    async with AsyncSessionLocal() as db:
        user = await _resolve_user(token=token, db=db)

    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid credentials")
        return

    await connection_manager.connect(user.id, websocket)

    await websocket.send_json(
        {
            "type": "ws:connected",
            "data": {
                "user_id": str(user.id),
                "online_user_ids": await connection_manager.get_online_user_ids(),
            },
        }
    )

    await connection_manager.broadcast(
        {
            "type": "user:online",
            "data": {
                "user_id": str(user.id),
            },
        }
    )

    try:
        while True:
            message = await websocket.receive_json()
            message_type = message.get("type")

            if message_type == "ws:ping":
                await websocket.send_json({"type": "ws:pong"})
                continue

            # Forward-compatible placeholder for future phases.
            await websocket.send_json({"type": "ws:ack", "data": {"message_type": message_type}})
    except WebSocketDisconnect:
        await connection_manager.disconnect(user.id, websocket)
        if await connection_manager.get_connection_count(user.id) == 0:
            await connection_manager.broadcast(
                {
                    "type": "user:offline",
                    "data": {
                        "user_id": str(user.id),
                    },
                }
            )