"""
WebSocket connection manager for real-time notifications.

Manages WebSocket connections for real-time push notifications to users.
Supports multiple connections per user (e.g., multiple browser tabs/devices).
"""

import asyncio
import uuid
import logging
from typing import Dict, Set
from dataclasses import dataclass, field
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    """
    Return timezone-naive UTC datetime for database compatibility.
    Database columns use TIMESTAMP WITHOUT TIME ZONE.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


@dataclass
class ConnectionInfo:
    """Information about a WebSocket connection."""
    websocket: WebSocket
    user_id: uuid.UUID
    connected_at: datetime = field(default_factory=utc_now)
    last_ping: datetime = field(default_factory=utc_now)


class WebSocketManager:
    """
    Manages WebSocket connections for real-time notifications.

    Features:
    - Multiple connections per user (multiple tabs/devices)
    - Thread-safe operations with asyncio.Lock
    - Automatic cleanup on disconnect
    - User online status tracking
    """

    def __init__(self):
        # user_id -> set of connection IDs
        self._user_connections: Dict[uuid.UUID, Set[str]] = {}
        # connection_id -> ConnectionInfo
        self._connections: Dict[str, ConnectionInfo] = {}
        # Lock for thread-safe operations
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID) -> str:
        """
        Accept WebSocket connection and register user.

        Args:
            websocket: The WebSocket connection
            user_id: UUID of the authenticated user

        Returns:
            connection_id: Unique ID for this connection
        """
        await websocket.accept()
        connection_id = str(uuid.uuid4())

        async with self._lock:
            conn_info = ConnectionInfo(websocket=websocket, user_id=user_id)
            self._connections[connection_id] = conn_info

            if user_id not in self._user_connections:
                self._user_connections[user_id] = set()
            self._user_connections[user_id].add(connection_id)

        logger.info(f"WebSocket connected: user={user_id}, conn={connection_id}")
        return connection_id

    async def disconnect(self, connection_id: str):
        """
        Remove connection on disconnect.

        Args:
            connection_id: The connection ID to remove
        """
        async with self._lock:
            if connection_id not in self._connections:
                return

            conn_info = self._connections.pop(connection_id)
            user_id = conn_info.user_id

            if user_id in self._user_connections:
                self._user_connections[user_id].discard(connection_id)
                if not self._user_connections[user_id]:
                    del self._user_connections[user_id]

        logger.info(f"WebSocket disconnected: conn={connection_id}")

    async def send_to_user(self, user_id: uuid.UUID, message: dict):
        """
        Send message to all connections of a specific user.

        Args:
            user_id: UUID of the user to send to
            message: Dict message to send (will be converted to JSON)
        """
        # Get copy of connection IDs to avoid lock during send
        async with self._lock:
            connection_ids = self._user_connections.get(user_id, set()).copy()

        disconnected = []
        for conn_id in connection_ids:
            conn_info = self._connections.get(conn_id)
            if conn_info:
                try:
                    await conn_info.websocket.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send to {conn_id}: {e}")
                    disconnected.append(conn_id)

        # Clean up disconnected
        for conn_id in disconnected:
            await self.disconnect(conn_id)

    async def broadcast_to_users(self, user_ids: list[uuid.UUID], message: dict):
        """
        Send message to multiple users.

        Args:
            user_ids: List of user UUIDs to send to
            message: Dict message to send
        """
        tasks = [self.send_to_user(uid, message) for uid in user_ids]
        await asyncio.gather(*tasks, return_exceptions=True)

    def get_online_users(self) -> Set[uuid.UUID]:
        """
        Get set of currently connected user IDs.

        Returns:
            Set of user UUIDs that have at least one active connection
        """
        return set(self._user_connections.keys())

    def is_user_online(self, user_id: uuid.UUID) -> bool:
        """
        Check if user has any active connections.

        Args:
            user_id: UUID of the user to check

        Returns:
            True if user has at least one active WebSocket connection
        """
        return user_id in self._user_connections

    async def update_last_ping(self, connection_id: str):
        """
        Update last ping timestamp for a connection.

        Args:
            connection_id: The connection ID to update
        """
        conn_info = self._connections.get(connection_id)
        if conn_info:
            conn_info.last_ping = utc_now()


# Global singleton instance
ws_manager = WebSocketManager()
