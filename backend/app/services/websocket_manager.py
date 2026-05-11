import asyncio
import uuid
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._active_connections: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._active_connections[user_id].add(websocket)

    async def disconnect(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        async with self._lock:
            user_connections = self._active_connections.get(user_id)
            if not user_connections:
                return

            user_connections.discard(websocket)
            if not user_connections:
                self._active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: uuid.UUID, payload: dict[str, Any]) -> None:
        connections = list(self._active_connections.get(user_id, set()))
        if not connections:
            return

        stale_connections: list[WebSocket] = []
        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception:
                stale_connections.append(connection)

        if stale_connections:
            async with self._lock:
                user_connections = self._active_connections.get(user_id)
                if not user_connections:
                    return

                for connection in stale_connections:
                    user_connections.discard(connection)

                if not user_connections:
                    self._active_connections.pop(user_id, None)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        users = list(self._active_connections.keys())
        for user_id in users:
            await self.send_to_user(user_id, payload)

    async def get_connection_count(self, user_id: uuid.UUID) -> int:
        return len(self._active_connections.get(user_id, set()))

    async def get_online_user_ids(self) -> list[str]:
        return [str(user_id) for user_id in self._active_connections.keys()]


connection_manager = ConnectionManager()