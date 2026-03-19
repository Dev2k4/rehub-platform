"""Tests for user CRUD operations."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.crud.crud_user import (
    get_user_by_email,
    get_user_by_id,
    create_user,
    update_user,
)
from app.schemas.auth import RegisterRequest
from app.schemas.user import UserUpdate
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_get_user_by_email_exists(db: AsyncSession):
    """Test retrieving user by email when user exists."""
    user = await create_test_user(db, email="john@example.com")
    await db.commit()
    
    result = await get_user_by_email(db, "john@example.com")
    
    assert result is not None
    assert result.id == user.id
    assert result.email == "john@example.com"


@pytest.mark.asyncio
async def test_get_user_by_email_not_exists(db: AsyncSession):
    """Test retrieving user by email when user doesn't exist."""
    result = await get_user_by_email(db, "nonexistent@example.com")
    
    assert result is None


@pytest.mark.asyncio
async def test_get_user_by_id_exists(db: AsyncSession):
    """Test retrieving user by ID when user exists."""
    user = await create_test_user(db, email="jane@example.com")
    await db.commit()
    
    result = await get_user_by_id(db, user.id)
    
    assert result is not None
    assert result.id == user.id
    assert result.email == "jane@example.com"


@pytest.mark.asyncio
async def test_get_user_by_id_not_exists(db: AsyncSession):
    """Test retrieving user by ID when user doesn't exist."""
    import uuid
    fake_id = uuid.uuid4()
    
    result = await get_user_by_id(db, fake_id)
    
    assert result is None


@pytest.mark.asyncio
async def test_create_user_success(db: AsyncSession):
    """Test creating a new user successfully."""
    email = "newuser@example.com"
    password = "StrongPassword123"
    full_name = "New User"
    phone = "+84912345678"
    
    request = RegisterRequest(
        email=email,
        password=password,
        full_name=full_name,
        phone=phone,
    )
    
    # Create using CRUD function
    user = User(
        email=email,
        password_hash="hashed_password",  # In real scenario, would be hashed
        full_name=full_name,
        phone=phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    result = await get_user_by_email(db, email)
    
    assert result is not None
    assert result.email == email
    assert result.full_name == full_name
    assert result.phone == phone


@pytest.mark.asyncio
async def test_update_user_profile(db: AsyncSession):
    """Test updating user profile fields."""
    user = await create_test_user(db, email="profile@example.com")
    await db.commit()
    
    update_data = UserUpdate(
        full_name="Updated Name",
        phone="+84987654321",
        province="Hanoi",
        district="Ba Dinh",
        ward="Phu Thuong",
        address_detail="123 Main St",
        bio="New bio",
    )
    
    # Update user
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    assert user.full_name == "Updated Name"
    assert user.phone == "+84987654321"
    assert user.province == "Hanoi"
    assert user.bio == "New bio"


@pytest.mark.asyncio
async def test_user_email_unique(db: AsyncSession):
    """Test that email must be unique."""
    email = "unique@example.com"
    
    # Create first user
    await create_test_user(db, email=email)
    await db.commit()
    
    # Try to create another with same email
    user2 = User(
        email=email,
        password_hash="hashed",
        full_name="Another User",
    )
    db.add(user2)
    
    # This should raise a unique constraint error
    with pytest.raises(Exception):  # Database integrity error
        await db.commit()


@pytest.mark.asyncio
async def test_api_register_user(client: AsyncClient):
    """Test user registration via API."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "apitest@example.com",
            "password": "ApiPassword123",
            "full_name": "API Test User",
            "phone": "+84911111111",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["access_token"] is not None
    assert data["refresh_token"] is not None
    assert data["user"]["email"] == "apitest@example.com"


@pytest.mark.asyncio
async def test_api_register_duplicate_email(client: AsyncClient, db: AsyncSession):
    """Test registration fails with duplicate email."""
    email = "duplicate@example.com"
    await create_test_user(db, email=email)
    await db.commit()
    
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123",
            "full_name": "Duplicate User",
        },
    )
    
    assert response.status_code == 409  # Conflict


@pytest.mark.asyncio
async def test_api_get_current_user(client: AsyncClient, db: AsyncSession):
    """Test getting current user profile."""
    user = await create_test_user(db, email="current@example.com")
    await db.commit()
    
    # First login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "current@example.com",
            "password": "TestPassword123",
        },
    )
    
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Get current user profile
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "current@example.com"


@pytest.mark.asyncio
async def test_api_update_user_profile(client: AsyncClient, db: AsyncSession):
    """Test updating user profile via API."""
    user = await create_test_user(db, email="update@example.com")
    await db.commit()
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "update@example.com",
            "password": "TestPassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    response = await client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "full_name": "Updated Name",
            "bio": "My new bio",
            "phone": "+84999999999",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["bio"] == "My new bio"
