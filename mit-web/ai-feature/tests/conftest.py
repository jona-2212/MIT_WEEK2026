from collections.abc import AsyncIterator
from datetime import UTC, datetime

import httpx
import pytest
from fastapi import FastAPI

from app.core.config import Settings
from app.main import create_app


@pytest.fixture(autouse=True)
def isolated_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in Settings.model_fields:
        monkeypatch.delenv(name.upper(), raising=False)

    def forbid_network(*args: object, **kwargs: object) -> None:
        raise AssertionError("Tes fondasi tidak boleh memanggil jaringan eksternal.")

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", forbid_network)
    monkeypatch.setattr(httpx.AsyncHTTPTransport, "handle_async_request", forbid_network)

    class KnowledgeSnapshotTime(datetime):
        @classmethod
        def now(cls, tz=None):
            return datetime(2026, 10, 31, 12, tzinfo=UTC)

    # Snapshot tanggal kurasi KB; tidak membekukan jam log/runtime aplikasi.
    monkeypatch.setattr("app.services.knowledge.retrieval.datetime", KnowledgeSnapshotTime)


@pytest.fixture
def settings() -> Settings:
    return Settings(_env_file=None, allowed_origins=["http://localhost:5173"])


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    return create_app(settings)


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[httpx.AsyncClient]:
    async with (
        app.router.lifespan_context(app),
        httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://testserver"
        ) as test_client,
    ):
        yield test_client
