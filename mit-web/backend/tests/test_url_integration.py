import json
import pytest

from app.schemas.recognition import AnalysisResponse
from tests.factories import (
    build_test_app,
    extraction,
    open_test_client,
)

pytestmark = pytest.mark.anyio


async def test_analyze_with_url_end_to_end(rag_bundle, monkeypatch) -> None:
    async def mock_fetch_url(url: str, timeout: float = 12.0):
        return "Lowongan Web Developer di Sitesguru.com", "Deskripsi: Dicari Frontend Web Developer di Malang."

    monkeypatch.setattr("app.services.uploads.fetch_url_content", mock_fetch_url)

    content = extraction()
    settings, embeddings = rag_bundle
    app, calls = build_test_app(content, settings=settings, embedding_provider=embeddings)

    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze",
            files={
                "url": (None, "https://glints.com/id/opportunities/jobs/web-developer/207dfabc"),
            },
        )

    assert response.status_code == 200
    result = AnalysisResponse.model_validate(response.json())
    assert result.input_mode == "url"
    assert len(calls) == 1
    upstream = json.loads(calls[0].content)
    sent_text = upstream["contents"][0]["parts"][0]["text"]
    assert "https://glints.com/id/opportunities/jobs/web-developer/207dfabc" in sent_text
    assert "Lowongan Web Developer di Sitesguru.com" in sent_text


async def test_analyze_with_invalid_url_rejected(rag_bundle) -> None:
    content = extraction()
    settings, embeddings = rag_bundle
    app, _ = build_test_app(content, settings=settings, embedding_provider=embeddings)

    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze",
            files={
                "url": (None, "http://127.0.0.1:8000/internal"),
            },
        )

    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "invalid_url"

