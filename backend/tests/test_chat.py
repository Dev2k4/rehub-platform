import pytest
from httpx import AsyncClient


async def register_and_login(client: AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": "Chat User",
        },
    )
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "Password123!"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_chat_conversation_send_and_history(client: AsyncClient):
    token_a = await register_and_login(client, "chat-a@example.com")
    token_b = await register_and_login(client, "chat-b@example.com")

    me_a = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    me_b = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert me_a.status_code == 200
    assert me_b.status_code == 200

    user_b_id = me_b.json()["id"]

    conv_resp = await client.post(
        f"/api/v1/chat/conversations/{user_b_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert conv_resp.status_code == 200
    conversation_id = conv_resp.json()["id"]

    send_resp = await client.post(
        f"/api/v1/chat/conversations/{conversation_id}/messages",
        json={"content": "hello encrypted world"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert send_resp.status_code == 201
    assert send_resp.json()["content"] == "hello encrypted world"

    history_resp = await client.get(
        f"/api/v1/chat/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert history_resp.status_code == 200
    payload = history_resp.json()
    assert payload["total"] == 1
    assert len(payload["items"]) == 1
    assert payload["items"][0]["content"] == "hello encrypted world"
