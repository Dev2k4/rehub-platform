import urllib.parse
from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env path: project_root/.env
ENV_FILE = Path(__file__).parent.parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ReHub API"
    API_V1_STR: str = "/api/v1"

    # Database
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    # Database pool settings
    DB_ECHO: bool = False  # Set True only for debugging
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # 30 minutes

    @property
    def DATABASE_URL(self) -> str:
        encoded_password = urllib.parse.quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{encoded_password}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # CORS - comma-separated list of allowed origins
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    # Redis (optional - for real-time multi-instance)
    REDIS_URL: Optional[str] = None
    
    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Uploads
    UPLOAD_DIR: str = "uploads"

    # Offers
    OFFER_EXPIRE_HOURS: int = 48
    OFFER_EXPIRY_JOB_INTERVAL_MINUTES: int = 5

    # Frontend host for generated links (email verification, password reset, ...)
    FRONTEND_HOST: str = "http://localhost:5173"

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    EMAILS_FROM_EMAIL: str = "daranbull1112@gmail.com"
    EMAILS_FROM_NAME: str = "ReHub Platform"
    REQUIRE_EMAIL_VERIFICATION: bool = False
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
