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
    elevenlabs_api_key: SecretStr | None = None

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

    @field_validator("gemini_api_key", "elevenlabs_api_key", mode="before")
    @classmethod
    def empty_key_is_none(cls, value: str | SecretStr | None) -> str | SecretStr | None:
        return None if isinstance(value, str) and not value.strip() else value

    @model_validator(mode="after")
    def validate_environment(self) -> "Settings":
        if self.app_env == "production" and self.debug:
            raise ValueError("DEBUG harus false pada APP_ENV=production.")
        return self
