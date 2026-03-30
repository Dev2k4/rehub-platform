import logging
import uuid
from pathlib import PurePosixPath
from urllib.parse import urlparse

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

logger = logging.getLogger(__name__)


def _parse_endpoint() -> tuple[str, bool]:
    endpoint = settings.MINIO_ENDPOINT.strip()
    parsed = urlparse(endpoint)

    if parsed.scheme and parsed.netloc:
        endpoint_host = parsed.netloc
        secure = parsed.scheme == "https"
    else:
        endpoint_host = endpoint
        secure = settings.MINIO_SECURE

    return endpoint_host, secure


def _public_base_url() -> str:
    public_base = settings.MINIO_PUBLIC_BASE_URL.strip().rstrip("/")
    if public_base:
        return public_base

    endpoint = settings.MINIO_ENDPOINT.strip().rstrip("/")
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        return endpoint
    scheme = "https" if settings.MINIO_SECURE else "http"
    return f"{scheme}://{endpoint}"


def _minio_client() -> Minio:
    endpoint_host, secure = _parse_endpoint()
    return Minio(
        endpoint_host,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=secure,
    )


def _listing_object_name(user_id: str, listing_id: str, ext: str) -> str:
    return f"{user_id}/{listing_id}/{uuid.uuid4().hex}.{ext}"


def _object_name_from_image_url(image_url: str) -> str | None:
    path = urlparse(image_url).path.strip("/")
    marker = f"/{settings.MINIO_BUCKET_NAME}/"
    marked_path = f"/{path}"
    marker_index = marked_path.find(marker)
    if marker_index == -1:
        return None

    object_name = marked_path[marker_index + len(marker):]
    if not object_name or PurePosixPath(object_name).is_absolute():
        return None
    return object_name


def upload_listing_image(
    file_bytes: bytes,
    ext: str,
    content_type: str,
    user_id: str,
    listing_id: str,
) -> str:
    if settings.STORAGE_BACKEND.lower() != "minio":
        raise RuntimeError("Storage backend is not set to minio")

    client = _minio_client()
    bucket = settings.MINIO_BUCKET_NAME
    object_name = _listing_object_name(user_id, listing_id, ext)

    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        from io import BytesIO
        client.put_object(
            bucket,
            object_name,
            BytesIO(file_bytes),
            length=len(file_bytes),
            content_type=content_type,
        )
    except S3Error as exc:
        logger.exception("Failed to upload listing image to MinIO")
        raise RuntimeError("Failed to upload image to MinIO") from exc

    return f"{_public_base_url()}/{bucket}/{object_name}"


def delete_listing_image(image_url: str) -> None:
    if settings.STORAGE_BACKEND.lower() != "minio":
        return

    object_name = _object_name_from_image_url(image_url)
    if not object_name:
        logger.warning("Skip MinIO delete: unable to derive object key from URL '%s'", image_url)
        return

    client = _minio_client()
    bucket = settings.MINIO_BUCKET_NAME

    try:
        client.remove_object(bucket, object_name)
    except S3Error:
        logger.exception("Failed to delete MinIO object '%s'", object_name)
