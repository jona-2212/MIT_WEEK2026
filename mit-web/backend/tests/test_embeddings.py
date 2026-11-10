import json

import httpx
import pytest

from app.core.config import Settings
from app.services.ai.embeddings import EmbeddingError, GeminiEmbeddingProvider, normalize_vector
from app.services.knowledge.static_index import StaticKnowledgeRetriever
from tests.legal_fixtures import MockEmbeddings

pytestmark = pytest.mark.anyio


async def test_embedding_rest_uses_consistent_tasks_and_server_header(capsys) -> None:
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(200, json={"embedding": {"values": [3.0, 4.0]}})

    settings = Settings(_env_file=None, gemini_api_key="synthetic-secret", embedding_dimensions=2)
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = GeminiEmbeddingProvider(settings, client)
        assert await provider.embed_documents(["synthetic-private-document"]) == [[0.6, 0.8]]
        assert await provider.embed_query("synthetic-private-query") == [0.6, 0.8]
    assert len(calls) == 2
    assert [json.loads(c.content)["taskType"] for c in calls] == [
        "RETRIEVAL_DOCUMENT",
        "RETRIEVAL_QUERY",
    ]
    assert all(c.url.host == "generativelanguage.googleapis.com" and not c.url.query for c in calls)
    assert all(c.headers["x-goog-api-key"] == "synthetic-secret" for c in calls)
    assert all(json.loads(c.content)["outputDimensionality"] == 2 for c in calls)
    output = capsys.readouterr().out
    assert "synthetic-secret" not in output and "synthetic-private" not in output


@pytest.mark.parametrize(
    "case", ["missing_key", "rate_limit", "timeout", "malformed", "dimension", "zero", "network"]
)
async def test_embedding_failures_are_safe_and_bounded(case) -> None:
    calls = []

    def handler(request):
        calls.append(request)
        if case == "rate_limit":
            return httpx.Response(429, text="synthetic-private-provider-body")
        if case == "timeout":
            raise httpx.ReadTimeout("synthetic-private")
        if case == "network":
            raise httpx.ConnectError("synthetic-private")
        if case == "malformed":
            return httpx.Response(200, content=b"private-not-json")
        return httpx.Response(
            200, json={"embedding": {"values": [0, 0] if case == "zero" else [1]}}
        )

    settings = Settings(
        _env_file=None,
        gemini_api_key=None if case == "missing_key" else "synthetic",
        embedding_dimensions=2,
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(EmbeddingError) as error:
            await GeminiEmbeddingProvider(settings, client).embed_query("private input")
    assert "private" not in str(error.value)
    assert len(calls) == (0 if case == "missing_key" else 1)


@pytest.mark.parametrize("vector", [[0, 0], [1], [True, 1], [float("nan"), 1], [float("inf"), 1]])
async def test_invalid_vectors_rejected(vector) -> None:
    with pytest.raises(EmbeddingError):
        normalize_vector(vector, 2)


@pytest.mark.parametrize(
    "reason",
    [
        "embedding_not_configured",
        "embedding_rate_limited",
        "embedding_timeout",
        "embedding_invalid_response",
    ],
)
async def test_embedding_failure_does_not_forge_legal_references(rag_bundle, reason) -> None:
    settings, _ = rag_bundle

    class Failing(MockEmbeddings):
        async def embed_query(self, text):
            raise EmbeddingError(reason)

    result = await StaticKnowledgeRetriever(settings, Failing()).retrieve(
        "biaya", {"recruitment_fees"}
    )
    assert result.status == "reference_unavailable" and result.references == []
