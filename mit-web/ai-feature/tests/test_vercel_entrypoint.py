import importlib
import sys

import pytest

from app.core.config import Settings
from tests.factories import NORMAL_TEXT, form_parts, open_test_client

pytestmark = pytest.mark.anyio


async def test_vercel_entrypoint_uses_factory_and_starts_without_keys(monkeypatch) -> None:
    # Import entrypoint tidak boleh membaca kredensial .env pengembang pada tes.
    monkeypatch.setattr("app.core.config.Settings", lambda **kw: Settings(_env_file=None, **kw))
    sys.modules.pop("index", None)
    entrypoint = importlib.import_module("index")
    try:
        app = entrypoint.app
        assert app.state.settings.upload_profile == "vercel"
        assert app.state.settings.max_request_bytes < 4_500_000
        async with open_test_client(app) as client:
            for path in ("/health", "/api/v1/health", "/docs", "/demo"):
                assert (await client.get(path)).status_code == 200
            response = await client.post("/api/v1/analyze", files=form_parts(NORMAL_TEXT))
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "provider_not_configured"
    finally:
        sys.modules.pop("index", None)
