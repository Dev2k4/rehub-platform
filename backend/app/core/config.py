import urllib.parse
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env path: project_root/.env
ENV_FILE = Path(__file__).parent.parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ReHub API"
    API_V1_STR: str = "/api/v1"
    TESTING: bool = False
    
    # Database
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    @property
    def DATABASE_URL(self) -> str:
        encoded_password = urllib.parse.quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{encoded_password}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Error tracking
    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    SENTRY_RELEASE: str = ""
    SENTRY_TEST_TOKEN: str = ""

    # Redis / cache
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL_SECONDS: int = 300

    # Uploads
    UPLOAD_DIR: str = "uploads"
    STORAGE_BACKEND: str = "local"
    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_PUBLIC_BASE_URL: str = ""
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_NAME: str = "rehub-listing"
    MINIO_SECURE: bool = False
    CHAT_MASTER_KEY: str = ""
    CHAT_MINIO_BUCKET_NAME: str = "rehub-chat"

    # Offers
    OFFER_EXPIRE_HOURS: int = 48
    OFFER_EXPIRY_JOB_INTERVAL_MINUTES: int = 5
    ESCROW_FUNDING_EXPIRE_HOURS: int = 24
    ESCROW_EXPIRY_JOB_INTERVAL_MINUTES: int = 5

    # Assistant AI
    ASSISTANT_AI_PROVIDER: str = "vertex"
    ASSISTANT_MAX_RESULTS_DEFAULT: int = 5
    VERTEX_AI_PROJECT_ID: str = ""
    VERTEX_AI_LOCATION: str = "us-central1"
    VERTEX_AI_MODEL: str = "gemini-2.5-flash"
    VERTEX_AI_ACCESS_TOKEN: str = ""
    VERTEX_AI_SERVICE_ACCOUNT_FILE: str = ""
    VERTEX_AI_SERVICE_ACCOUNT_JSON: str = ""

    # Frontend host for generated links (email verification, password reset, ...)
    FRONTEND_HOST: str = "https://happiness-eaten-flashy.ngrok-free.dev"
    BACKEND_PUBLIC_BASE_URL: str = "https://enduring-pope-urethane.ngrok-free.dev"
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://happiness-eaten-flashy.ngrok-free.dev"

    # SMS / OTP
    SMS_DEBUG_MODE: bool = True

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    EMAILS_FROM_EMAIL: str = "daranbull1112@gmail.com"
    EMAILS_FROM_NAME: str = "ReHub Platform"
    REQUIRE_EMAIL_VERIFICATION: bool = True
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_EXPIRE_HOURS: int = 1
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()


def get_cors_origins() -> list[str]:
    raw = settings.BACKEND_CORS_ORIGINS.strip()
    if not raw:
        return []
    return [item.strip().rstrip("/") for item in raw.split(",") if item.strip()]
