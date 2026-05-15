"""Upload endpoints for proof images (delivery/receipt evidence)."""
import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.storage_service import upload_proof_image

router = APIRouter(prefix="/uploads", tags=["Uploads"])
logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PROOF_SIZE_MB = 10
MAX_PROOF_SIZE_BYTES = MAX_PROOF_SIZE_MB * 1024 * 1024

EXT_MAP = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


class ProofImageUploadResponse(BaseModel):
    url: str


@router.post("/proof-image", response_model=ProofImageUploadResponse)
async def upload_proof_image_route(
    order_id: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProofImageUploadResponse:
    """Upload a proof image (delivery or receipt evidence) to MinIO.

    Returns the public URL of the uploaded image.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{content_type}' not allowed. Accepted: JPG, PNG, WEBP.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_PROOF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_PROOF_SIZE_MB} MB.",
        )

    ext = EXT_MAP.get(content_type, "jpg")

    try:
        url = upload_proof_image(
            file_bytes=file_bytes,
            ext=ext,
            content_type=content_type,
            user_id=str(current_user.id),
            order_id=order_id,
        )
    except RuntimeError as exc:
        logger.exception("Failed to upload proof image for order %s", order_id)
        raise HTTPException(status_code=500, detail="Failed to upload image. Please try again.") from exc

    return ProofImageUploadResponse(url=url)
