import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_user import get_user_by_email
from app.core.security import create_password_reset_token, verify_password

@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient, db: AsyncSession):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "Password123!",
            "full_name": "Test User",
            "phone": "0123456789"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"
    
    # Check db
    user = await get_user_by_email(db, "test@example.com")
    assert user is not None
    assert user.full_name == "Test User"

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, db: AsyncSession):
    # First user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "password": "Password123!",
            "full_name": "Test User",
        }
    )
    # Second user same email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "password": "Password123!",
            "full_name": "Another User",
        }
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_duplicate_unverified_resends_verification(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup-unverified@example.com",
            "password": "Password123!",
            "full_name": "Test User",
        }
    )

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup-unverified@example.com",
            "password": "Password123!",
            "full_name": "Another User",
        }
    )

    assert response.status_code == 409
    assert "not verified" in response.json().get("detail", "")

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "Password123!",
            "full_name": "Login User",
        }
    )
    
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "login@example.com",
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong@example.com",
            "password": "Password123!",
            "full_name": "Login User",
        }
    )
    
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "wrong@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_resend_verification_success(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "resend@example.com",
            "password": "Password123!",
            "full_name": "Resend User",
        },
    )

    response = await client.post(
        "/api/v1/auth/resend-verification",
        json={"email": "resend@example.com"},
    )

    assert response.status_code == 200
    assert "message" in response.json()


@pytest.mark.asyncio
async def test_forgot_password_returns_generic_message(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "not-found@example.com"},
    )

    assert response.status_code == 200
    assert "message" in response.json()


@pytest.mark.asyncio
async def test_reset_password_updates_hash(client: AsyncClient, db: AsyncSession):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "reset@example.com",
            "password": "Password123!",
            "full_name": "Reset User",
        },
    )

    token = create_password_reset_token("reset@example.com")
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": token,
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 200
    user = await get_user_by_email(db, "reset@example.com")
    assert user is not None
    assert verify_password("NewPassword123!", user.password_hash)
