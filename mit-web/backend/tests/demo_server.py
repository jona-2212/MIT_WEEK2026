"""Server khusus uji browser; tidak pernah dipakai application factory produksi."""

import json

import httpx
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

from app.core.config import PROJECT_ROOT, Settings
from app.main import create_app, render_demo
from tests.factories import SUSPICIOUS_TEXT, envelope, extraction, observation
from tests.legal_fixtures import MockEmbeddings


def create_test_app() -> FastAPI:
    def mocked_provider(request: httpx.Request) -> httpx.Response:
        parts = json.loads(request.content)["contents"][0]["parts"]
        text = json.loads(parts[0]["text"])["job_text"]
        has_image = any("inline_data" in part for part in parts)
        observations = []
        for code, quote in [
            ("upfront_payment", "Transfer biaya administrasi Rp150.000"),
            ("urgency_pressure", "Konfirmasi hari ini juga"),
        ]:
            if quote.casefold() in text.casefold():
                observations.append(observation(code, quote))
            if has_image:
                observations.append(observation(code, quote, "image"))
        content = extraction(*observations, image_text=SUSPICIOUS_TEXT if has_image else "")
        return httpx.Response(200, json=envelope(content))

    settings = Settings(
        _env_file=None,
        app_env="test",
        app_name="Job Scam Guardian AI — MODE UJI MOCK",
        gemini_api_key="synthetic-test-key",
        legal_index_path=PROJECT_ROOT / "tests/fixtures/legal_index",
        legal_registry_path=PROJECT_ROOT / "tests/fixtures/legal_sources.json",
    )
    app = create_app(
        settings,
        provider_transport=httpx.MockTransport(mocked_provider),
        embedding_provider=MockEmbeddings(),
    )
    app.router.routes[:] = [
        route for route in app.router.routes if getattr(route, "path", None) != "/demo"
    ]

    @app.get("/demo", include_in_schema=False)
    async def test_demo() -> HTMLResponse:
        html = render_demo(settings)
        html = html.replace(
            "<main>",
            (
                '<main><p class="notice" role="status"><strong>MODE UJI MOCK</strong> — '
                "Ekstraksi, embedding, dan PDF adalah fixture sintetis. Tidak ada request Gemini; "
                "bukan hasil AI nyata.</p>"
            ),
            1,
        )
        html = html.replace("02 · Hasil analisis", "02 · Hasil analisis — MODE UJI MOCK")
        return HTMLResponse(html)

    return app
