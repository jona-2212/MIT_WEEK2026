import json
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from io import BytesIO

import httpx
from fastapi import FastAPI
from PIL import Image

from app.core.config import Settings
from app.main import create_app

SUSPICIOUS_TEXT = (
    "Lowongan staf administrasi PT Contoh Fiktif. Transfer biaya administrasi Rp150.000 "
    "sebelum wawancara. Konfirmasi hari ini juga dan jangan menghubungi kantor untuk verifikasi."
)
NORMAL_TEXT = (
    "PT Contoh Fiktif membuka posisi staf administrasi untuk pencatatan stok dan surat. "
    "Syarat lulusan SMA, mampu mengoperasikan komputer. Proses tidak dipungut biaya. "
    "Jangan bagikan OTP atau password kepada perekrut. Jadwal wawancara akan diberitahukan."
)
CODES = [
    "upfront_payment",
    "credential_request",
    "premature_sensitive_data",
    "urgency_pressure",
    "unrealistic_offer",
    "unofficial_channel",
]


def observation(code: str, quote: str, source: str = "text", state: str = "detected") -> dict:
    return {"code": code, "state": state, "evidence": [{"source": source, "quote": quote}]}


def extraction(
    *observations: dict, image_text: str = "", sufficient: bool = True, related: bool = True
) -> dict:
    codes = {item["code"] for item in observations}
    return {
        "is_job_related": related,
        "sufficient_content": sufficient,
        "image_text": image_text,
        "indicators": list(observations)
        + [
            {"code": code, "state": "not_detected", "evidence": []}
            for code in CODES
            if code not in codes
        ],
    }


def envelope(content: dict) -> dict:
    return {
        "candidates": [
            {
                "finishReason": "STOP",
                "content": {
                    "parts": [{"text": json.dumps(content)}],
                    "role": "model",
                },
            }
        ],
        "usageMetadata": {"promptTokenCount": 120, "candidatesTokenCount": 80},
    }


def image_bytes(fmt: str = "PNG", size: tuple[int, int] = (60, 40), **kwargs) -> bytes:
    output = BytesIO()
    Image.new("RGB", size, (220, 230, 220)).save(output, format=fmt, **kwargs)
    return output.getvalue()


def build_test_app(
    content: dict | None = None,
    *,
    handler: Callable[[httpx.Request], httpx.Response] | None = None,
    settings: Settings | None = None,
) -> tuple[FastAPI, list[httpx.Request]]:
    calls: list[httpx.Request] = []

    def handle(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        if handler:
            return handler(request)
        return httpx.Response(200, json=envelope(content if content is not None else extraction()))

    settings = settings or Settings(_env_file=None, gemini_api_key="synthetic-test-key")
    return create_app(settings, provider_transport=httpx.MockTransport(handle)), calls


@asynccontextmanager
async def open_test_client(app: FastAPI) -> AsyncIterator[httpx.AsyncClient]:
    async with (
        app.router.lifespan_context(app),
        httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://testserver"
        ) as client,
    ):
        yield client


def form_parts(
    text: str | None = None, image: bytes | None = None, mime: str = "image/png"
) -> list:
    parts = []
    if text is not None:
        parts.append(("text", (None, text)))
    if image is not None:
        parts.append(("file", ("synthetic.png", image, mime)))
    return parts
