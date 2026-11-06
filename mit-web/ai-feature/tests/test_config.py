from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_development_defaults_without_env_file_or_keys() -> None:
    settings = Settings(_env_file=None)
    assert settings.app_env == "development"
    assert settings.debug is False
    assert settings.allowed_origins == []
    assert settings.gemini_api_key is None
    assert settings.elevenlabs_api_key is None


def test_environment_overrides_dotenv(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "APP_NAME=From dotenv\nGEMINI_API_KEY=\nELEVENLABS_API_KEY=\n"
        "ALLOWED_ORIGINS=http://localhost:3000, https://frontend.example/\n",
        encoding="utf-8",
    )
    monkeypatch.setenv("APP_NAME", "From environment")
    settings = Settings(_env_file=env_file)
    assert settings.app_name == "From environment"
    assert settings.allowed_origins == ["http://localhost:3000", "https://frontend.example"]
    assert settings.gemini_api_key is None
    assert settings.elevenlabs_api_key is None


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "https://*.example",
        "file:///demo",
        "https://user:pass@example.org",
        "https://example.org/path",
    ],
)
def test_invalid_cors_origins_are_rejected(origin: str) -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, allowed_origins=[origin])


def test_production_disallows_debug() -> None:
    with pytest.raises(ValidationError, match="DEBUG harus false"):
        Settings(_env_file=None, app_env="production", debug=True)


def test_configured_secrets_are_masked() -> None:
    settings = Settings(_env_file=None, gemini_api_key="synthetic-test-key")
    assert "synthetic-test-key" not in repr(settings)


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -1.1, 1.1])
def test_experimental_threshold_must_be_finite_and_bounded(value) -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, legal_min_similarity=value)
