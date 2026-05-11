import json
import uuid
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_current_user, get_db
from app.crud import crud_chat
from app.models.listing import Listing, ListingImage
from app.models.user import User
from app.schemas.chat import (
    ChatConversationRead,
    ChatListingPreview,
    ChatMarkReadResponse,
    ChatMessageHistoryRead,
    ChatMessageRead,
    ChatMessageSendRequest,
)
from app.services.chat_crypto_service import decrypt_message_content, encrypt_message_content
from app.services.chat_storage_service import get_chat_blob, put_chat_blob
from app.services.websocket_manager import connection_manager

router = APIRouter(prefix="/chat", tags=["Chat"])


async def _build_listing_preview(db: AsyncSession, listing_id: uuid.UUID) -> ChatListingPreview | None:
    listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = listing_result.scalar_one_or_none()
    if not listing:
        return None

    image_result = await db.execute(
        select(ListingImage)
        .where(ListingImage.listing_id == listing_id)
        .order_by(desc(ListingImage.is_primary), ListingImage.created_at.asc())
        .limit(1)
    )
    image = image_result.scalar_one_or_none()

    image_url = None
    if image:
        image_url = image.thumbnail_url or image.image_url

    return ChatListingPreview(
        id=listing.id,
        title=listing.title,
        price=Decimal(listing.price),
        image_url=image_url,
    )


def _payload_from_decrypted_content(content: str) -> dict[str, Any]:
    try:
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    return {
        "message_type": "text",
        "content": content,
    }


async def _to_conversation_read(
    db: AsyncSession,
    row,
    current_user_id: uuid.UUID,
) -> ChatConversationRead:
    unread_count = await crud_chat.count_unread_messages(db, row.id, current_user_id)
    return ChatConversationRead(
        id=row.id,
        participant_a_id=row.participant_a_id,
        participant_b_id=row.participant_b_id,
        unread_count=unread_count,
        last_message_at=row.last_message_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post("/conversations/{other_user_id}", response_model=ChatConversationRead)
async def create_or_get_conversation(
    other_user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")

    conversation = await crud_chat.get_or_create_conversation(db, current_user.id, other_user_id)
    return await _to_conversation_read(db, conversation, current_user.id)


@router.get("/conversations", response_model=list[ChatConversationRead])
async def list_my_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await crud_chat.list_user_conversations(db, current_user.id)
    return [await _to_conversation_read(db, row, current_user.id) for row in rows]


@router.get("/conversations/{conversation_id}/messages", response_model=ChatMessageHistoryRead)
async def list_conversation_messages(
    conversation_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await crud_chat.get_conversation_for_user(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    rows = await crud_chat.list_messages(db, conversation_id, skip=skip, limit=limit)
    total = await crud_chat.count_messages(db, conversation_id)

    items: list[ChatMessageRead] = []
    for row in rows:
        aad = f"{conversation_id}:{row.id}"
        try:
            encrypted_blob = get_chat_blob(row.object_key)
            payload = json.loads(encrypted_blob.decode("utf-8"))
            content = decrypt_message_content(payload, conversation.encrypted_dek, aad)
        except Exception:
            content = "[Tin nhan khong the giai ma]"

        decoded_payload = _payload_from_decrypted_content(content)
        message_type = decoded_payload.get("message_type")
        if message_type not in {"text", "listing_share"}:
            message_type = "text"

        listing_preview = None
        raw_listing = decoded_payload.get("listing")
        if isinstance(raw_listing, dict):
            try:
                listing_preview = ChatListingPreview.model_validate(raw_listing)
            except Exception:
                listing_preview = None

        items.append(
            ChatMessageRead(
                id=row.id,
                conversation_id=row.conversation_id,
                sender_id=row.sender_id,
                message_type=message_type,
                content=decoded_payload.get("content"),
                listing=listing_preview,
                created_at=row.created_at,
            )
        )

    if skip == 0:
        latest_seen = items[-1].created_at if items else None
        await crud_chat.mark_conversation_read(
            db,
            conversation_id,
            current_user.id,
            read_at=latest_seen,
        )
        await db.commit()

    return ChatMessageHistoryRead(
        items=items,
        total=total,
        page=(skip // limit) + 1,
        size=limit,
    )


@router.post("/conversations/{conversation_id}/read", response_model=ChatMarkReadResponse)
async def mark_conversation_read(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await crud_chat.get_conversation_for_user(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await crud_chat.mark_conversation_read(db, conversation_id, current_user.id)
    await db.commit()
    return ChatMarkReadResponse(ok=True)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatMessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: uuid.UUID,
    data: ChatMessageSendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await crud_chat.get_conversation_for_user(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if data.message_type == "text":
        if not data.content or not data.content.strip():
            raise HTTPException(status_code=400, detail="Noi dung tin nhan khong duoc de trong")
    elif data.message_type == "listing_share":
        if not data.listing_id:
            raise HTTPException(status_code=400, detail="listing_id is required for listing_share")
    else:
        raise HTTPException(status_code=400, detail="Invalid message_type")

    message_id = uuid.uuid4()
    object_key = f"v1/conv/{conversation_id}/{message_id}.json"
    aad = f"{conversation_id}:{message_id}"

    listing_preview = None
    if data.message_type == "listing_share" and data.listing_id:
        listing_preview = await _build_listing_preview(db, data.listing_id)
        if not listing_preview:
            raise HTTPException(status_code=404, detail="Listing not found")

    message_payload: dict[str, Any] = {
        "message_type": data.message_type,
        "content": data.content.strip() if data.content else None,
        "listing": listing_preview.model_dump(mode="json") if listing_preview else None,
    }

    encrypted_payload = encrypt_message_content(
        plaintext=json.dumps(message_payload, ensure_ascii=False),
        wrapped_dek=conversation.encrypted_dek,
        aad=aad,
    )
    raw_payload = json.dumps(encrypted_payload).encode("utf-8")

    try:
        put_chat_blob(object_key, raw_payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    row = await crud_chat.create_message_index(
        db=db,
        message_id=message_id,
        conversation_id=conversation_id,
        sender_id=current_user.id,
        object_key=object_key,
        size_bytes=len(raw_payload),
    )

    recipient_id = (
        conversation.participant_b_id
        if conversation.participant_a_id == current_user.id
        else conversation.participant_a_id
    )

    event_payload = {
        "type": "chat:message",
        "data": {
            "message": {
                "id": str(row.id),
                "conversation_id": str(conversation_id),
                "sender_id": str(current_user.id),
                "message_type": data.message_type,
                "content": data.content.strip() if data.content else None,
                "listing": listing_preview.model_dump(mode="json") if listing_preview else None,
                "created_at": row.created_at.isoformat(),
            }
        },
    }
    await connection_manager.send_to_user(recipient_id, event_payload)
    await connection_manager.send_to_user(current_user.id, event_payload)

    return ChatMessageRead(
        id=row.id,
        conversation_id=row.conversation_id,
        sender_id=row.sender_id,
        message_type=data.message_type,
        content=data.content.strip() if data.content else None,
        listing=listing_preview,
        created_at=row.created_at,
    )
