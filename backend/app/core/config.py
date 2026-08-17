from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, read from environment variables or backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./comunidade.db"
    supabase_database_url: str | None = None
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_secret_key: str | None = None
    supabase_storage_bucket: str = "announcement-images"
    supabase_admin_emails: str = ""
    supabase_jwt_secret: str | None = None
    upload_dir: Path = Path("./uploads")
    secret_key: str = Field(min_length=32)
    admin_password_hash: str = Field(min_length=1)
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    cookie_secure: bool = False
    max_upload_bytes: int = 5 * 1024 * 1024
    pii_hmac_key: str = Field(min_length=32)
    privacy_notice_version: str = "2026-08-17"

    @property
    def origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def admin_emails(self) -> set[str]:
        return {email.strip().lower() for email in self.supabase_admin_emails.split(",") if email.strip()}

    @property
    def database_connection_url(self) -> str:
        return self.supabase_database_url or self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
