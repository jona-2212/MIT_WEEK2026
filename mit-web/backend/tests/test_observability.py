import asyncio
import json
from uuid import uuid4

import httpx
import pytest
from fastapi import FastAPI

from app.core.config import Settings
from app.core.logging import request_id_context
from app.main import create_app

pytestmark = pytest.mark.anyio


@pytest.mark.parametrize("path", ["/health", "/api/v1/health", "/docs", "/openapi.json"])
async def test_request_log_preserves_full_registered_path(
    settings: Settings, capsys: pytest.CaptureFixture[str], path: str
) -> None:
    app = create_app(settings)
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        response = await client.get(path)
    logs = [json.loads(line) for line in capsys.readouterr().out.splitlines()]
    event = next(log for log in logs if log["event"] == "http_request_completed")
    assert event["path"] == path
    assert event["request_id"] == response.headers["x-request-id"]


@pytest.mark.parametrize("debug", [False, True])
async def test_internal_error_is_sanitized_and_has_cors(
    settings: Settings, capsys: pytest.CaptureFixture[str], debug: bool
) -> None:
    app = create_app(settings.model_copy(update={"debug": debug}))

    @app.get("/_test/failure")
    async def failure() -> None:
        raise RuntimeError("synthetic-sensitive-value")

    async with (
        app.router.lifespan_context(app),
        httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://testserver"
        ) as client,
    ):
        response = await client.get("/_test/failure", headers={"Origin": "http://localhost:5173"})
        assert response.status_code == 500
        assert response.json() == {
            "request_id": response.headers["x-request-id"],
            "error": {
                "code": "internal_error",
                "message": "Terjadi kesalahan pada server.",
                "request_id": response.headers["x-request-id"],
            },
        }
        assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    logs = capsys.readouterr().out
    assert "synthetic-sensitive-value" not in response.text + logs
    parsed = [json.loads(line) for line in logs.splitlines()]
    failure_event = next(log for log in parsed if log["event"] == "http_request_failed")
    assert failure_event["request_id"] == response.headers["x-request-id"]
    assert failure_event["error_category"] == "RuntimeError"
    completed = next(log for log in parsed if log["event"] == "http_request_completed")
    assert completed["status_code"] == 500


async def test_validation_errors_do_not_echo_input(app: FastAPI, client: httpx.AsyncClient) -> None:
    @app.get("/_test/validation")
    async def validated(value: int) -> dict[str, int]:
        return {"value": value}

    response = await client.get("/_test/validation", params={"value": "synthetic-private-input"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert response.json()["error"]["request_id"] == response.headers["x-request-id"]
    assert "synthetic-private-input" not in response.text


async def test_structured_logs_only_contain_safe_request_metadata(
    settings: Settings, capsys: pytest.CaptureFixture[str]
) -> None:
    app = create_app(settings)

    @app.get("/_test/items/{item_id}")
    async def item(item_id: str) -> dict[str, bool]:
        return {"ok": True}

    async with (
        app.router.lifespan_context(app),
        httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://testserver"
        ) as client,
    ):
        response = await client.get(
            "/_test/items/synthetic-personal-id?key=synthetic-query-secret",
            headers={"Authorization": "Bearer synthetic-header-secret"},
        )
        await client.get("/synthetic-unknown-private-path")
    output = capsys.readouterr().out
    for secret in (
        "synthetic-personal-id",
        "synthetic-query-secret",
        "synthetic-header-secret",
        "synthetic-unknown-private-path",
    ):
        assert secret not in output
    logs = [json.loads(line) for line in output.splitlines()]
    assert logs[0]["event"] == "application_started"
    assert logs[-1]["event"] == "application_stopped"
    requests = [log for log in logs if log["event"] == "http_request_completed"]
    assert requests[0]["request_id"] == response.headers["x-request-id"]
    assert requests[0]["path"] == "/_test/items/{item_id}"
    assert requests[1]["path"] == "<unmatched>"
    for log in requests:
        assert log["timestamp"].endswith("Z")
        assert log["log_level"] == "INFO"
        assert log["method"] == "GET"
        assert log["duration_ms"] >= 0
        assert log["service"] == "Job Scam Guardian AI"


async def test_concurrent_request_ids_are_isolated_and_context_is_reset(
    app: FastAPI, client: httpx.AsyncClient
) -> None:
    @app.get("/_test/context")
    async def context() -> dict[str, str | None]:
        await asyncio.sleep(0)
        return {"request_id": request_id_context.get()}

    ids = [str(uuid4()) for _ in range(8)]
    responses = await asyncio.gather(
        *[client.get("/_test/context", headers={"X-Request-ID": request_id}) for request_id in ids]
    )
    for request_id, response in zip(ids, responses, strict=True):
        assert response.json()["request_id"] == request_id
        assert response.headers["x-request-id"] == request_id
    assert request_id_context.get() is None
