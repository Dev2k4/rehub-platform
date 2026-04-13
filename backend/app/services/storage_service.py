import logging
import uuid
from io import BytesIO
from pathlib import Path
from pathlib import PurePosixPath
from urllib.parse import urlparse

from PIL import Image, ImageOps
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


def _listing_object_name(user_id: str, listing_id: str, ext: str, suffix: str = "") -> str:
    return f"{user_id}/{listing_id}/{uuid.uuid4().hex}{suffix}.{ext}"


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


def _optimize_listing_image(
    file_bytes: bytes,
    original_ext: str,
    original_content_type: str,
) -> tuple[bytes, bytes | None, str, str]:
    try:
        with Image.open(BytesIO(file_bytes)) as source_image:
            image = ImageOps.exif_transpose(source_image)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGB")
            elif image.mode == "RGBA":
                background = Image.new("RGB", image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1])
                image = background

            main_image = image.copy()
            main_image.thumbnail((1600, 1600))

            thumbnail_image = image.copy()
            thumbnail_image.thumbnail((480, 480))

            main_buffer = BytesIO()
            main_image.save(main_buffer, format="WEBP", quality=85, method=6)

            thumbnail_buffer = BytesIO()
            thumbnail_image.save(thumbnail_buffer, format="WEBP", quality=78, method=6)

            return main_buffer.getvalue(), thumbnail_buffer.getvalue(), "webp", "image/webp"
    except Exception:
        logger.exception("Falling back to original image bytes because optimization failed")
        return file_bytes, None, original_ext, original_content_type


def upload_listing_image(
    file_bytes: bytes,
    ext: str,
    content_type: str,
    user_id: str,
    listing_id: str,
) -> tuple[str, str | None]:
    if settings.STORAGE_BACKEND.lower() != "minio":
        optimized_bytes, thumbnail_bytes, optimized_ext, _optimized_content_type = _optimize_listing_image(
            file_bytes,
            ext,
            content_type,
        )
        object_name = _listing_object_name(user_id, listing_id, optimized_ext)
        thumbnail_object_name = _listing_object_name(user_id, listing_id, optimized_ext, suffix="_thumb")

        root = Path(settings.UPLOAD_DIR) / "listings"
        main_path = root / object_name
        main_path.parent.mkdir(parents=True, exist_ok=True)
        main_path.write_bytes(optimized_bytes)

        thumbnail_url: str | None = None
        if thumbnail_bytes is not None:
            thumb_path = root / thumbnail_object_name
            thumb_path.parent.mkdir(parents=True, exist_ok=True)
            thumb_path.write_bytes(thumbnail_bytes)
            thumbnail_url = (
                f"{settings.BACKEND_PUBLIC_BASE_URL.rstrip('/')}/uploads/listings/{thumbnail_object_name}"
            )

        image_url = f"{settings.BACKEND_PUBLIC_BASE_URL.rstrip('/')}/uploads/listings/{object_name}"
        return image_url, thumbnail_url

    client = _minio_client()
    bucket = settings.MINIO_BUCKET_NAME
    optimized_bytes, thumbnail_bytes, optimized_ext, optimized_content_type = _optimize_listing_image(
        file_bytes,
        ext,
        content_type,
    )
    object_name = _listing_object_name(user_id, listing_id, optimized_ext)
    thumbnail_object_name = _listing_object_name(user_id, listing_id, optimized_ext, suffix="_thumb")

    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        client.put_object(
            bucket,
            object_name,
            BytesIO(optimized_bytes),
            length=len(optimized_bytes),
            content_type=optimized_content_type,
        )
        thumbnail_url: str | None = None
        if thumbnail_bytes is not None:
            client.put_object(
                bucket,
                thumbnail_object_name,
                BytesIO(thumbnail_bytes),
                length=len(thumbnail_bytes),
                content_type="image/webp",
            )
            thumbnail_url = f"{_public_base_url()}/{bucket}/{thumbnail_object_name}"
    except S3Error as exc:
        logger.exception("Failed to upload listing image to MinIO")
        raise RuntimeError("Failed to upload image to MinIO") from exc

    return f"{_public_base_url()}/{bucket}/{object_name}", thumbnail_url


def delete_listing_image(image_url: str, thumbnail_url: str | None = None) -> None:
    if settings.STORAGE_BACKEND.lower() != "minio":
        for raw_url in [image_url, thumbnail_url]:
            if not raw_url:
                continue
            parsed = urlparse(raw_url)
            upload_prefix = "/uploads/listings/"
            if not parsed.path.startswith(upload_prefix):
                continue
            relative_path = parsed.path[len(upload_prefix):]
            if not relative_path:
                continue
            target_path = Path(settings.UPLOAD_DIR) / "listings" / relative_path
            try:
                if target_path.exists() and target_path.is_file():
                    target_path.unlink()
            except Exception:
                logger.exception("Failed to delete local listing image %s", target_path)
        return

    client = _minio_client()
    bucket = settings.MINIO_BUCKET_NAME

    object_names = [
        _object_name_from_image_url(image_url),
        _object_name_from_image_url(thumbnail_url) if thumbnail_url else None,
    ]

    try:
        for object_name in object_names:
            if not object_name:
                continue
            client.remove_object(bucket, object_name)
    except S3Error:
        logger.exception("Failed to delete one or more MinIO objects for listing image")
