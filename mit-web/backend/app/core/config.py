from pathlib import Path
from typing import Annotated, Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="Job Scam Guardian AI", min_length=1, max_length=100)
    app_env: Literal["development", "test", "production"] = "development"
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    allowed_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    gemini_api_key: SecretStr | None = None
    gemini_model: str = Field(
        default="gemini-3.5-flash-lite", pattern=r"^[a-z0-9][a-z0-9.-]{0,99}$"
    )
    gemini_timeout_seconds: float = Field(default=45.0, ge=1.0, le=120.0)
    upload_profile: Literal["local", "vercel"] = "local"
    legal_index_path: Path = PROJECT_ROOT / "data/legal_index"
    legal_registry_path: Path = PROJECT_ROOT / "data/knowledge/sources.json"
    embedding_model: str = Field(default="gemini-embedding-001", pattern=r"^[a-z0-9.-]{1,100}$")
    embedding_dimensions: int = Field(default=768, ge=1, le=3072)
    embedding_timeout_seconds: float = Field(default=15.0, ge=1, le=60)
    legal_top_k: int = Field(default=3, ge=1, le=10)
    legal_min_similarity: float = Field(default=0.75, ge=-1, le=1, allow_inf_nan=False)
    roleplay_signing_secret: SecretStr | None = None
    gemini_roleplay_model: str | None = Field(default=None, pattern=r"^[a-z0-9][a-z0-9.-]{0,99}$")
    elevenlabs_api_key: SecretStr | None = None

    @property
    def max_image_bytes(self) -> int:
        return (4 if self.upload_profile == "vercel" else 5) * 1024 * 1024

    @property
    def max_request_bytes(self) -> int:
        # Total raw multipart, termasuk teks, header part, dan boundary.
        return self.max_image_bytes + 64 * 1024

    @field_validator("legal_index_path", "legal_registry_path")
    @classmethod
    def absolute_legal_path(cls, value: Path) -> Path:
        return value if value.is_absolute() else PROJECT_ROOT / value

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: str | list[str]) -> list[str]:
        origins = value.split(",") if isinstance(value, str) else value
        result = []
        for origin in origins:
            origin = origin.strip()
            if not origin:
                continue
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.hostname
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path not in {"", "/"}
                or parsed.query
                or parsed.fragment
                or "*" in origin
            ):
                raise ValueError("ALLOWED_ORIGINS harus berupa origin HTTP(S) eksplisit.")
            # Mengakses port juga memvalidasi rentang dan formatnya.
            _ = parsed.port
            normalized = origin.rstrip("/")
            if normalized not in result:
                result.append(normalized)
        return result

    @field_validator(
        "gemini_api_key", "elevenlabs_api_key", "roleplay_signing_secret", mode="before"
    )
    @classmethod
    def empty_key_is_none(cls, value: str | SecretStr | None) -> str | SecretStr | None:
        return None if isinstance(value, str) and not value.strip() else value

    @field_validator("gemini_roleplay_model", mode="before")
    @classmethod
    def default_roleplay_model(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @model_validator(mode="after")
    def validate_environment(self) -> "Settings":
        if self.app_env == "production" and self.debug:
            raise ValueError("DEBUG harus false pada APP_ENV=production.")
        return self
