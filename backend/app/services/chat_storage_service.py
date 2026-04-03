from pathlib import Path

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


def _chat_bucket() -> str:
    return settings.CHAT_MINIO_BUCKET_NAME


def _minio_client() -> Minio:
    endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
    return Minio(
        endpoint,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


def put_chat_blob(object_key: str, payload: bytes) -> None:
    if settings.STORAGE_BACKEND.lower() != "minio":
        root = Path(settings.UPLOAD_DIR) / "chat"
        file_path = root / object_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(payload)
        return

    client = _minio_client()
    bucket = _chat_bucket()
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        from io import BytesIO

        client.put_object(
            bucket,
            object_key,
            BytesIO(payload),
            length=len(payload),
            content_type="application/json",
        )
    except S3Error as exc:
        raise RuntimeError("Failed to upload encrypted chat blob") from exc


def get_chat_blob(object_key: str) -> bytes:
    if settings.STORAGE_BACKEND.lower() != "minio":
        root = Path(settings.UPLOAD_DIR) / "chat"
        file_path = root / object_key
        return file_path.read_bytes()

    client = _minio_client()
    bucket = _chat_bucket()
    try:
        response = client.get_object(bucket, object_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()
    except S3Error as exc:
        raise RuntimeError("Failed to load encrypted chat blob") from exc
