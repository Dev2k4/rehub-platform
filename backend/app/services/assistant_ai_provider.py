import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class VertexAIProvider:
    def _load_service_account_info(self) -> dict[str, Any] | None:
        if settings.VERTEX_AI_SERVICE_ACCOUNT_JSON.strip():
            try:
                parsed = json.loads(settings.VERTEX_AI_SERVICE_ACCOUNT_JSON)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                logger.exception("Invalid VERTEX_AI_SERVICE_ACCOUNT_JSON payload")
        return None

    def _resolve_access_token(self) -> str | None:
        if settings.VERTEX_AI_ACCESS_TOKEN.strip():
            return settings.VERTEX_AI_ACCESS_TOKEN.strip()

        service_account_info = self._load_service_account_info()
        service_account_file = settings.VERTEX_AI_SERVICE_ACCOUNT_FILE.strip()

        if not service_account_info and not service_account_file:
            return None

        try:
            from google.auth.transport.requests import Request
            from google.oauth2 import service_account
        except Exception:
            logger.exception(
                "google-auth is required for Vertex AI service-account authentication"
            )
            return None

        scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        try:
            if service_account_info:
                creds = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=scopes,
                )
            else:
                creds = service_account.Credentials.from_service_account_file(
                    service_account_file,
                    scopes=scopes,
                )

            creds.refresh(Request())
            return creds.token
        except Exception:
            logger.exception("Failed to obtain Vertex AI token from service account")
            return None

    async def generate_answer(self, *, prompt: str) -> str:
        access_token = self._resolve_access_token()
        if not access_token:
            return "Minh chua duoc cau hinh Vertex AI token. Day la cau tra loi tam de ban test luong du lieu."

        endpoint = (
            f"https://{settings.VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/"
            f"projects/{settings.VERTEX_AI_PROJECT_ID}/locations/{settings.VERTEX_AI_LOCATION}/"
            f"publishers/google/models/{settings.VERTEX_AI_MODEL}:generateContent"
        )
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 400,
            },
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        candidates = data.get("candidates") or []
        if not candidates:
            return "Minh chua the tao cau tra loi luc nay."

        parts = candidates[0].get("content", {}).get("parts", [])
        texts = [part.get("text", "") for part in parts if isinstance(part, dict)]
        answer = "\n".join(item for item in texts if item).strip()
        if not answer:
            return "Minh chua the tao cau tra loi luc nay."
        return answer


class MockAIProvider:
    async def generate_answer(self, *, prompt: str) -> str:
        _ = prompt
        return (
            "Toi da tong hop du lieu that tu he thong de goi y ket qua. "
            "Ban co the dieu chinh lai tu khoa, khoang gia, hoac yeu cau theo khu vuc de tim sat hon."
        )


def get_ai_provider() -> VertexAIProvider | MockAIProvider:
    if settings.ASSISTANT_AI_PROVIDER.lower() == "vertex":
        return VertexAIProvider()
    return MockAIProvider()


def build_grounded_prompt(*, question: str, retrieval_context: dict) -> str:
    context_json = json.dumps(retrieval_context, ensure_ascii=False)
    return (
        "Ban la tro ly mua ban cho ReHub. "
        "Chi duoc tra loi dua tren du lieu context da cung cap, khong duoc bo sung du lieu ben ngoai. "
        "Tra loi ngan gon, tieng Viet, uu tien thong tin co the hanh dong.\n\n"
        f"Cau hoi nguoi dung: {question}\n"
        f"Context du lieu: {context_json}\n\n"
        "Yeu cau:"
        "\n1) Neu co ket qua listing, tom tat 1-2 cau va nhac nguoi dung co the loc tiep."
        "\n2) Neu la uy tin nguoi ban, neu ro trust_score, rating_avg, rating_count, completed_orders."
        "\n3) Neu khong du du lieu, noi ro la khong tim thay ket qua phu hop."
    )
