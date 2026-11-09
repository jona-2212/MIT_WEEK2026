from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from app import __version__
from app.core.config import Settings
from app.main import create_app

pytestmark = pytest.mark.anyio


async def test_startup_with_development_defaults_without_keys() -> None:
    app = create_app(Settings(_env_file=None))
    async with (
        app.router.lifespan_context(app),
        AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client,
    ):
        response = await client.get("/health")
    assert response.status_code == 200
    assert app.state.settings.app_env == "development"
    assert app.state.settings.gemini_api_key is None
    assert app.state.settings.elevenlabs_api_key is None


@pytest.mark.parametrize("path", ["/health", "/api/v1/health"])
async def test_health_contract(client: AsyncClient, path: str) -> None:
    response = await client.get(path)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert response.json() == {
        "status": "ok",
        "service": "Job Scam Guardian AI",
        "version": __version__,
    }
    assert UUID(response.headers["x-request-id"]).version == 4


async def test_documentation_and_openapi(client: AsyncClient) -> None:
    docs = await client.get("/docs")
    assert docs.status_code == 200
    assert "swagger-ui" in docs.text
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["version"] == __version__
    assert set(schema["paths"]) == {
        "/health",
        "/api/v1/health",
        "/api/v1/analyze",
        *{
            f"/api/v1/roleplay/{path}"
            for path in ("scenarios", "chat-scenarios", "custom", "start", "turn", "chat", "tts")
        },
    }
    assert set(schema["paths"]["/api/v1/roleplay/tts"]) == {"post"}
    assert set(schema["components"]["schemas"]["HealthResponse"]["properties"]) == {
        "status",
        "service",
        "version",
    }


async def test_demo_is_served_from_the_backend(client: AsyncClient) -> None:
    response = await client.get("/demo")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert 'fetch("/api/v1/health"' in response.text
    assert 'href="/docs"' in response.text


async def test_accepts_valid_request_id(client: AsyncClient) -> None:
    request_id = "66f30281-d8e3-4fb6-9dfa-e48db972f808"
    response = await client.get("/health", headers={"X-Request-ID": request_id})
    assert response.headers["x-request-id"] == request_id


@pytest.mark.parametrize("supplied", ["untrusted-input", "x" * 200, "?" * 36])
async def test_replaces_invalid_request_id(client: AsyncClient, supplied: str) -> None:
    response = await client.get("/health", headers={"X-Request-ID": supplied})
    generated = response.headers["x-request-id"]
    assert generated != supplied
    assert UUID(generated).version == 4


async def test_new_requests_have_different_ids(client: AsyncClient) -> None:
    first = await client.get("/health")
    second = await client.get("/health")
    assert first.headers["x-request-id"] != second.headers["x-request-id"]


async def test_cors_for_explicit_origin(client: AsyncClient) -> None:
    response = await client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "X-Request-ID" in response.headers["access-control-expose-headers"]
    assert "access-control-allow-credentials" not in response.headers


async def test_cors_does_not_authorize_unknown_origin(client: AsyncClient) -> None:
    response = await client.get("/health", headers={"Origin": "https://unknown.example"})
    assert "access-control-allow-origin" not in response.headers


async def test_cors_preflight_is_traceable(client: AsyncClient) -> None:
    response = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Request-ID",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert UUID(response.headers["x-request-id"]).version == 4


@pytest.mark.parametrize("method,path,code", [("GET", "/missing", 404), ("POST", "/health", 405)])
async def test_http_errors_have_safe_contract(
    client: AsyncClient, method: str, path: str, code: int
) -> None:
    response = await client.request(method, path)
    assert response.status_code == code
    error = response.json()["error"]
    assert error["code"] == "http_error"
    assert error["request_id"] == response.headers["x-request-id"]
    if code == 405:
        assert "GET" in response.headers["allow"]
