"""
WebSocket endpoint for real-time notifications.

Client connects to: ws://host/api/v1/ws?token=<jwt_access_token>

Message format received from server:
{
    "type": "notification",  // or "connected", "pong"
    "data": {...}
}

Client can send:
{
    "type": "ping"
}
"""

import uuid
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.websocket_manager import ws_manager
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token for authentication")
):
    """
    WebSocket endpoint for real-time notifications.

    Connection URL: ws://host/api/v1/ws?token=<jwt_access_token>

    Server messages:
    - {"type": "connected", "connection_id": "...", "user_id": "..."}
    - {"type": "notification", "data": {...}}
    - {"type": "pong"}

    Client messages:
    - {"type": "ping"} -> Server responds with {"type": "pong"}
    """
    # Authenticate via JWT token
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload.get("sub"))
    except Exception as e:
        logger.warning(f"WebSocket auth failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return

    # Connect user
    connection_id = await ws_manager.connect(websocket, user_id)

    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "connection_id": connection_id,
            "user_id": str(user_id)
        })

        # Listen for messages (ping/pong keep-alive)
        while True:
            try:
                data = await websocket.receive_json()

                # Handle ping/pong
                if data.get("type") == "ping":
                    await ws_manager.update_last_ping(connection_id)
                    await websocket.send_json({"type": "pong"})

            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error for connection {connection_id}: {e}")
                break

    finally:
        await ws_manager.disconnect(connection_id)
