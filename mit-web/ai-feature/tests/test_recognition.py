import json
from tempfile import SpooledTemporaryFile

import httpx
import pytest

from app.core.config import Settings
from app.schemas.recognition import AnalysisResponse
from app.services.knowledge.static_index import StaticKnowledgeRetriever
from app.services.uploads import MAX_IMAGE_BYTES, MAX_REQUEST_BYTES
from tests.factories import (
    NORMAL_TEXT,
    SUSPICIOUS_TEXT,
    build_test_app,
    extraction,
    form_parts,
    image_bytes,
    observation,
    open_test_client,
)
from tests.legal_fixtures import MockEmbeddings

pytestmark = pytest.mark.anyio


async def test_text_only_end_to_end_with_mocked_gemini(rag_bundle) -> None:
    content = extraction(
        observation("upfront_payment", "Transfer biaya administrasi Rp150.000"),
        observation("urgency_pressure", "Konfirmasi hari ini juga"),
    )
    settings, embeddings = rag_bundle
    app, calls = build_test_app(content, settings=settings, embedding_provider=embeddings)
    request_id = "a8b8f493-3681-4a1c-89b8-654d33700910"
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze",
            files=form_parts(SUSPICIOUS_TEXT),
            headers={"X-Request-ID": request_id},
        )
    assert response.status_code == 200
    result = AnalysisResponse.model_validate(response.json())
    assert result.request_id == response.headers["x-request-id"] == request_id
    assert result.input_mode == "text"
    assert result.fraud_assessment.risk_category == "high"
    assert result.legal_screening.status == "needs_more_context"
    assert {item.source_id for item in result.legal_screening.references} == {"mock-legal-fixture"}
    assert embeddings.query_calls == 1
    assert len(calls) == 1
    upstream = json.loads(calls[0].content)
    assert SUSPICIOUS_TEXT in upstream["contents"][0]["parts"][0]["text"]
    assert "inline_data" not in upstream["contents"][0]["parts"][0]


@pytest.mark.parametrize(
    "fmt,mime", [("PNG", "image/png"), ("JPEG", "image/jpeg"), ("WEBP", "image/webp")]
)
async def test_image_only_decoded_and_sent_as_inline_data(fmt: str, mime: str) -> None:
    content = extraction(
        observation("upfront_payment", "Transfer biaya administrasi Rp150.000", "image"),
        image_text=SUSPICIOUS_TEXT,
    )
    app, calls = build_test_app(content)
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze", files=form_parts(image=image_bytes(fmt), mime=mime)
        )
    assert response.status_code == 200
    assert response.json()["input_mode"] == "image"
    assert response.json()["fraud_assessment"]["risk_category"] == "high"
    assert len(calls) == 1
    parts = json.loads(calls[0].content)["contents"][0]["parts"]
    assert parts[1]["inline_data"]["mime_type"] == mime


async def test_combined_input_is_one_request_and_no_double_scoring() -> None:
    content = extraction(
        observation("upfront_payment", "Transfer biaya administrasi Rp150.000"),
        observation("upfront_payment", "Transfer biaya administrasi Rp150.000", "image"),
        image_text=SUSPICIOUS_TEXT,
    )
    app, calls = build_test_app(content)
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze", files=form_parts(SUSPICIOUS_TEXT, image_bytes())
        )
    assert response.status_code == 200
    data = response.json()
    assert data["input_mode"] == "both"
    assert data["fraud_assessment"]["risk_category"] == "high"
    assert len(data["fraud_assessment"]["indicators"][0]["evidence"]) == 2
    assert len(calls) == 1


async def test_normal_offer_does_not_claim_verified_safety() -> None:
    app, _ = build_test_app()
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(NORMAL_TEXT))
    data = response.json()
    assert response.status_code == 200
    assert data["fraud_assessment"]["risk_category"] == "low"
    assert "tidak dinyatakan aman" in data["fraud_assessment"]["summary"]
    assert "bukan" in data["disclaimer"]
    assert data["legal_screening"]["status"] == "reference_unavailable"


async def test_tiny_text_is_insufficient_without_calling_ai() -> None:
    app, calls = build_test_app(settings=Settings(_env_file=None))
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts("halo"))
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == data["fraud_assessment"]["risk_category"] == "insufficient_data"
    assert "risk_score" not in response.text and "score_breakdown" not in response.text
    assert calls == []


@pytest.mark.parametrize(
    "content",
    [
        extraction(sufficient=False),
        extraction(related=False),
        extraction(image_text="buram", sufficient=True),
    ],
)
async def test_unreadable_image_is_insufficient(content: dict) -> None:
    app, _ = build_test_app(content)
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(image=image_bytes()))
    assert response.status_code == 200
    assert response.json()["fraud_assessment"]["risk_category"] == "insufficient_data"


async def test_unsupported_evidence_is_removed_from_final_score() -> None:
    content = extraction(observation("upfront_payment", "minta biaya seribu juta"))
    app, _ = build_test_app(content)
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(NORMAL_TEXT))
    assert response.status_code == 200
    assert response.json()["fraud_assessment"]["risk_category"] == "insufficient_data"
    assert response.json()["fraud_assessment"]["indicators"][0]["state"] == "uncertain"
    assert "minta biaya seribu juta" not in response.text


@pytest.mark.parametrize(
    "case,status,code",
    [
        ("empty", 400, "empty_input"),
        ("corrupt", 415, "invalid_image"),
        ("mime", 415, "unsupported_image_type"),
        ("mismatch", 415, "image_type_mismatch"),
        ("oversized", 413, "image_too_large"),
        ("long_text", 422, "invalid_text"),
        ("duplicate_file", 422, "invalid_multipart"),
        ("wrong_type", 422, "invalid_form_field"),
        ("json", 415, "multipart_required"),
    ],
)
async def test_validation_errors_never_call_provider(case: str, status: int, code: str) -> None:
    app, calls = build_test_app()
    async with open_test_client(app) as client:
        if case == "empty":
            response = await client.post(
                "/api/v1/analyze",
                content=b"--empty--\r\n",
                headers={"Content-Type": "multipart/form-data; boundary=empty"},
            )
        elif case == "json":
            response = await client.post("/api/v1/analyze", json={"text": NORMAL_TEXT})
        else:
            parts = {
                "corrupt": form_parts(image=b"broken-synthetic-image"),
                "mime": form_parts(image=image_bytes(), mime="image/gif"),
                "mismatch": form_parts(image=image_bytes(), mime="image/jpeg"),
                "oversized": form_parts(image=b"x" * (MAX_IMAGE_BYTES + 1)),
                "long_text": form_parts("x" * 12001),
                "duplicate_file": form_parts(image=image_bytes()) * 2,
                "wrong_type": [("file", (None, "not-a-file"))],
            }[case]
            response = await client.post("/api/v1/analyze", files=parts)
    assert response.status_code == status, response.text
    error = response.json()
    assert error["error"]["code"] == code
    assert error["request_id"] == error["error"]["request_id"] == response.headers["x-request-id"]
    assert calls == []


async def test_chunked_body_limit_without_content_length() -> None:
    async def chunks():
        for _ in range(6):
            yield b"x" * (1024 * 1024)

    app, calls = build_test_app()
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze",
            content=chunks(),
            headers={"Content-Type": "multipart/form-data; boundary=limited"},
        )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "request_too_large"
    assert calls == []


async def test_declared_oversized_request_is_rejected_before_parse() -> None:
    app, calls = build_test_app()
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze",
            content=b"",
            headers={
                "Content-Type": "multipart/form-data; boundary=x",
                "Content-Length": str(MAX_REQUEST_BYTES + 1),
            },
        )
    assert response.status_code == 413
    assert calls == []


async def test_upload_above_default_spool_threshold_stays_in_memory(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def forbid_rollover(*args, **kwargs):
        raise AssertionError("Input mentah tidak boleh ditulis ke disk.")

    monkeypatch.setattr(SpooledTemporaryFile, "rollover", forbid_rollover)
    data = image_bytes(size=(800, 600), compress_level=0)
    assert len(data) > 1024 * 1024
    app, _ = build_test_app(extraction(image_text=NORMAL_TEXT))
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(image=data))
    assert response.status_code == 200


async def test_missing_key_returns_honest_error_and_no_score() -> None:
    app, calls = build_test_app(settings=Settings(_env_file=None))
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(NORMAL_TEXT))
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "provider_not_configured"
    assert "risk_score" not in response.json()
    assert calls == []


@pytest.mark.parametrize(
    "upstream,status,code",
    [
        (401, 503, "provider_auth_error"),
        (403, 503, "provider_auth_error"),
        (429, 503, "provider_rate_limited"),
        (500, 502, "provider_error"),
        (404, 503, "provider_model_unavailable"),
        (504, 504, "provider_timeout"),
    ],
)
async def test_upstream_errors_are_sanitized(upstream: int, status: int, code: str) -> None:
    app, _ = build_test_app(
        handler=lambda request: httpx.Response(upstream, text="synthetic-secret-provider-body")
    )
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(NORMAL_TEXT))
    assert response.status_code == status
    assert response.json()["error"]["code"] == code
    assert "synthetic-secret" not in response.text
    assert "risk_score" not in response.json()


@pytest.mark.parametrize(
    "error,status,code",
    [
        (httpx.ReadTimeout("synthetic-private"), 504, "provider_timeout"),
        (httpx.ConnectError("synthetic-private"), 503, "provider_unavailable"),
    ],
)
async def test_provider_network_failures(error: Exception, status: int, code: str) -> None:
    def fail(request):
        raise error

    app, _ = build_test_app(handler=fail)
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(NORMAL_TEXT))
    assert response.status_code == status
    assert response.json()["error"]["code"] == code
    assert "synthetic-private" not in response.text


async def test_demo_and_openapi_expose_unified_contract() -> None:
    app, _ = build_test_app()
    async with open_test_client(app) as client:
        demo = await client.get("/demo")
        api = (await client.get("/openapi.json")).json()
        preflight = await client.options(
            "/api/v1/analyze",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
        )
    assert demo.status_code == 200
    assert 'fetch("/api/v1/analyze"' in demo.text
    assert 'type="file"' in demo.text
    assert "Google Gemini" in demo.text
    assert "textContent" in demo.text
    schema = api["paths"]["/api/v1/analyze"]["post"]["requestBody"]["content"][
        "multipart/form-data"
    ]["schema"]
    assert set(schema["properties"]) == {"text", "file"}
    assert schema["properties"]["file"]["format"] == "binary"
    assert preflight.status_code == 400  # Origin belum dikonfigurasi pada test app ini.


async def test_unavailable_knowledge_does_not_block_recognition(tmp_path) -> None:
    content = extraction(observation("upfront_payment", "Transfer biaya administrasi Rp150.000"))
    app, _ = build_test_app(content)
    async with open_test_client(app) as client:
        app.state.recognition_service.knowledge = StaticKnowledgeRetriever(
            Settings(_env_file=None, legal_index_path=tmp_path / "missing"), MockEmbeddings()
        )
        response = await client.post("/api/v1/analyze", files=form_parts(SUSPICIOUS_TEXT))
    assert response.status_code == 200
    assert response.json()["fraud_assessment"]["risk_category"] == "high"
    assert response.json()["legal_screening"]["status"] == "reference_unavailable"
    assert response.json()["legal_screening"]["references"] == []


async def test_multipart_cutoff_never_silently_drops_image() -> None:
    body = (
        b'--cutoff\r\nContent-Disposition: form-data; name="text"\r\n\r\n'
        + NORMAL_TEXT.encode()
        + b'\r\n--cutoff\r\nContent-Disposition: form-data; name="file"; filename="x.png"'
        + b"\r\nContent-Type: image/png\r\n\r\npartial image with no closing boundary"
    )
    app, calls = build_test_app()
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze",
            content=body,
            headers={"Content-Type": "multipart/form-data; boundary=cutoff"},
        )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_multipart"
    assert calls == []


async def test_post_cors_and_trimmed_text_are_supported() -> None:
    settings = Settings(
        _env_file=None,
        gemini_api_key="synthetic-test-key",
        allowed_origins=["http://localhost:5173"],
    )
    app, calls = build_test_app(settings=settings)
    async with open_test_client(app) as client:
        preflight = await client.options(
            "/api/v1/analyze",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
        )
        response = await client.post(
            "/api/v1/analyze",
            files=form_parts("  " + NORMAL_TEXT + "\n  "),
            headers={"Origin": "http://localhost:5173"},
        )
    assert preflight.status_code == response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    sent = json.loads(calls[0].content)["contents"][0]["parts"][0]["text"]
    assert json.loads(sent)["job_text"] == NORMAL_TEXT


async def test_openapi_response_examples_are_valid_and_qualitative() -> None:
    app, _ = build_test_app()
    schema = app.openapi()
    examples = schema["paths"]["/api/v1/analyze"]["post"]["responses"]["200"]["content"][
        "application/json"
    ]["examples"]
    for item in examples.values():
        result = AnalysisResponse.model_validate(item["value"])
        assert result.fraud_assessment.risk_category == "high"
    serialized = json.dumps(schema)
    for forbidden in ("risk_score", "score_breakdown", "scoring_version", '"weight"'):
        assert forbidden not in serialized


@pytest.mark.parametrize("chunked", [False, True])
async def test_vercel_total_multipart_limit_is_enforced(chunked: bool) -> None:
    settings = Settings(_env_file=None, upload_profile="vercel")
    assert settings.max_image_bytes == 4 * 1024 * 1024
    assert settings.max_request_bytes < 4_500_000
    app, calls = build_test_app(settings=settings)

    async def chunks():
        for _ in range(5):
            yield b"x" * (1024 * 1024)

    headers = {"Content-Type": "multipart/form-data; boundary=test"}
    if not chunked:
        headers["Content-Length"] = str(settings.max_request_bytes + 1)
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze", content=chunks() if chunked else b"", headers=headers
        )
        demo = await client.get("/demo")
    assert response.status_code == 413 and calls == []
    assert "Maksimal 4 MiB" in demo.text and "__MAX_IMAGE_BYTES__" not in demo.text


async def test_model_category_conflict_and_forged_legal_quotes_are_safe(rag_bundle) -> None:
    settings, embeddings = rag_bundle
    content = extraction(
        observation("upfront_payment", "Transfer biaya administrasi Rp150.000"),
        category="low",
        legal_observations=[
            {
                "topic": "personal_data",
                "evidence": [
                    {
                        "source": "text",
                        "quote": "Permintaan data pribadi tidak terdapat pada sumber",
                    }
                ],
            }
        ],
    )
    app, calls = build_test_app(content, settings=settings, embedding_provider=embeddings)
    async with open_test_client(app) as client:
        result = (await client.post("/api/v1/analyze", files=form_parts(SUSPICIOUS_TEXT))).json()
    assert result["fraud_assessment"]["risk_category"] == result["status"] == "insufficient_data"
    assert len(calls) == embeddings.query_calls == 1
    assert all(ref["page_start"] == 1 for ref in result["legal_screening"]["references"])


async def test_text_url_is_never_fetched() -> None:
    app, calls = build_test_app()
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze", files=form_parts(NORMAL_TEXT + " https://example.invalid/job")
        )
    assert response.status_code == 200 and len(calls) == 1
    assert calls[0].url.host == "generativelanguage.googleapis.com"


@pytest.mark.parametrize(
    "reason", ["embedding_timeout", "embedding_rate_limited", "embedding_not_configured"]
)
async def test_rag_provider_failure_preserves_successful_fraud(rag_bundle, reason) -> None:
    from app.services.ai.embeddings import EmbeddingError

    settings, _ = rag_bundle

    class Failing(MockEmbeddings):
        async def embed_query(self, text):
            raise EmbeddingError(reason)

    content = extraction(observation("upfront_payment", "Transfer biaya administrasi Rp150.000"))
    app, calls = build_test_app(content, settings=settings, embedding_provider=Failing())
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(SUSPICIOUS_TEXT))
    assert response.status_code == 200 and len(calls) == 1
    data = response.json()
    assert data["fraud_assessment"]["risk_category"] == "high"
    assert data["legal_screening"]["status"] == "reference_unavailable"
    assert data["legal_screening"]["references"] == []
    assert reason in data["legal_screening"]["warnings"]


async def test_vercel_individual_file_limit_and_pdf_input_rejection() -> None:
    settings = Settings(_env_file=None, upload_profile="vercel")
    app, calls = build_test_app(settings=settings)
    async with open_test_client(app) as client:
        response = await client.post(
            "/api/v1/analyze", files=form_parts(image=b"x" * (settings.max_image_bytes + 1))
        )
        pdf = await client.post(
            "/api/v1/analyze", files=[("file", ("law.pdf", b"%PDF-fixture", "application/pdf"))]
        )
    assert response.status_code == 413 and response.json()["error"]["code"] == "image_too_large"
    assert pdf.status_code == 415 and pdf.json()["error"]["code"] == "unsupported_image_type"
    assert calls == []


async def test_mock_demo_exercises_real_api_and_labels_all_fixture_outputs() -> None:
    from tests.demo_server import create_test_app

    async with open_test_client(create_test_app()) as client:
        html = (await client.get("/demo")).text
        response = await client.post("/api/v1/analyze", files=form_parts(SUSPICIOUS_TEXT))
    assert "MODE UJI MOCK" in html and "__MAX_IMAGE_BYTES__" not in html
    assert "risk_score" not in html and "score_breakdown" not in html
    assert response.status_code == 200
    legal = response.json()["legal_screening"]
    assert legal["references"] and all(
        r["source_kind"] == "test_fixture" for r in legal["references"]
    )


@pytest.mark.parametrize(
    "code,quote",
    [
        ("unrealistic_offer", "Gaji bulanan Rp100.000.000"),
        ("unofficial_channel", "Hubungi alamat Gmail perekrut"),
    ],
)
async def test_salary_or_channel_alone_never_supports_high(code, quote) -> None:
    text = f"Lowongan staf administrasi PT Contoh Fiktif. {quote}. Rincian proses belum tersedia."
    app, _ = build_test_app(extraction(observation(code, quote), category="high"))
    async with open_test_client(app) as client:
        response = await client.post("/api/v1/analyze", files=form_parts(text))
    assert response.status_code == 200
    assert response.json()["fraud_assessment"]["risk_category"] == "insufficient_data"
