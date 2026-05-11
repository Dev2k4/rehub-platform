import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii")


def _b64d(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("ascii"))


def _master_key() -> bytes:
    if settings.CHAT_MASTER_KEY:
        return hashlib.sha256(settings.CHAT_MASTER_KEY.encode("utf-8")).digest()
    if settings.SECRET_KEY:
        return hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return hashlib.sha256(b"rehub-chat-fallback-key").digest()


def generate_wrapped_conversation_key() -> str:
    dek = os.urandom(32)
    nonce = os.urandom(12)
    wrapped = AESGCM(_master_key()).encrypt(nonce, dek, b"chat:dek")
    return _b64e(nonce + wrapped)


def _unwrap_conversation_key(wrapped_dek: str) -> bytes:
    payload = _b64d(wrapped_dek)
    nonce = payload[:12]
    ciphertext = payload[12:]
    return AESGCM(_master_key()).decrypt(nonce, ciphertext, b"chat:dek")


def encrypt_message_content(
    plaintext: str,
    wrapped_dek: str,
    aad: str,
) -> dict[str, str]:
    nonce = os.urandom(12)
    dek = _unwrap_conversation_key(wrapped_dek)
    ciphertext = AESGCM(dek).encrypt(nonce, plaintext.encode("utf-8"), aad.encode("utf-8"))
    return {
        "nonce": _b64e(nonce),
        "ciphertext": _b64e(ciphertext),
    }


def decrypt_message_content(payload: dict[str, str], wrapped_dek: str, aad: str) -> str:
    dek = _unwrap_conversation_key(wrapped_dek)
    nonce = _b64d(payload["nonce"])
    ciphertext = _b64d(payload["ciphertext"])
    plaintext = AESGCM(dek).decrypt(nonce, ciphertext, aad.encode("utf-8"))
    return plaintext.decode("utf-8")
