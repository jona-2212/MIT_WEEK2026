import asyncio
import base64
import json
import logging
from time import perf_counter

import httpx
from pydantic import ValidationError

from app.core.config import PROJECT_ROOT, Settings
from app.core.errors import AnalysisError
from app.schemas.recognition import AIExtraction
from app.services.uploads import ValidatedImage

logger = logging.getLogger("job_scam_guardian.ai")
PROMPT_VERSION = "recognition-v2.1"
MAX_PROVIDER_BYTES = 256 * 1024
SYSTEM_PROMPT = (PROJECT_ROOT / "app/services/ai/prompts/recognition-v2.txt").read_text(
    encoding="utf-8"
)


class GeminiProvider:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client

    def build_payload(self, text: str, image: ValidatedImage | None) -> dict:
        schema = AIExtraction.model_json_schema()
        # Gemini rejects maxItems in this schema. Pydantic still validates the response limits.
        for definition in (schema, *schema.get("$defs", {}).values()):
            for field in definition.get("properties", {}).values():
                field.pop("maxItems", None)

        parts: list[dict] = [{"text": json.dumps({"job_text": text}, ensure_ascii=False)}]
        if image is not None:
            parts.append(
                {
                    "inline_data": {
                        "mime_type": image.mime_type,
                        "data": base64.b64encode(image.data).decode("ascii"),
                    }
                }
            )
        return {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "maxOutputTokens": 8192,
                "responseFormat": {
                    "text": {
                        "mimeType": "APPLICATION_JSON",
                        "schema": schema,
                    }
                },
            },
        }

    async def extract(self, text: str, image: ValidatedImage | None) -> AIExtraction:
        started = perf_counter()
        metadata = {
            "component": "recognition",
            "provider": "gemini",
            "model": self.settings.gemini_model,
            "prompt_template_version": PROMPT_VERSION,
        }
        try:
            if self.settings.gemini_api_key is None:
                raise AnalysisError(
                    503,
                    "provider_not_configured",
                    "Gemini belum dikonfigurasi. Isi GEMINI_API_KEY pada backend, "
                    "lalu jalankan ulang server.",
                )
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.settings.gemini_model}:generateContent"
            )
            async with asyncio.timeout(self.settings.gemini_timeout_seconds):
                async with self.client.stream(
                    "POST",
                    url,
                    headers={"x-goog-api-key": self.settings.gemini_api_key.get_secret_value()},
                    json=self.build_payload(text, image),
                ) as response:
                    if response.status_code != 200:
                        self.raise_upstream_error(response.status_code)
                    data = bytearray()
                    async for chunk in response.aiter_bytes():
                        data.extend(chunk)
                        if len(data) > MAX_PROVIDER_BYTES:
                            raise AnalysisError(
                                502, "provider_invalid_response", "Respons AI terlalu besar."
                            )
            try:
                payload = json.loads(data)
                candidates = payload.get("candidates", [])
                if not candidates or candidates[0].get("finishReason") != "STOP":
                    raise ValueError("incomplete_or_blocked")
                parts = candidates[0]["content"]["parts"]
                content = "".join(
                    part["text"] for part in parts if "text" in part and not part.get("thought")
                )
                extraction = AIExtraction.model_validate_json(content)
                usage = payload.get("usageMetadata", {})
                for provider_key, log_key in (
                    ("promptTokenCount", "input_tokens"),
                    ("candidatesTokenCount", "output_tokens"),
                ):
                    value = usage.get(provider_key)
                    if type(value) is int and value >= 0:
                        metadata[log_key] = value
            except (ValueError, KeyError, TypeError, AttributeError, ValidationError):
                raise AnalysisError(
                    502,
                    "provider_invalid_response",
                    "Hasil AI tidak valid atau tidak lengkap. Coba kembali.",
                ) from None
        except (TimeoutError, httpx.TimeoutException):
            error = AnalysisError(
                504, "provider_timeout", "AI tidak merespons tepat waktu. Coba kembali."
            )
            self.log_failure(error, started, metadata)
            raise error from None
        except httpx.HTTPError:
            error = AnalysisError(
                503, "provider_unavailable", "Layanan AI tidak dapat dihubungi. Coba kembali."
            )
            self.log_failure(error, started, metadata)
            raise error from None
        except AnalysisError as error:
            self.log_failure(error, started, metadata)
            raise
        logger.info(
            "ai_request_completed",
            extra={
                **metadata,
                "success": True,
                "latency_ms": round((perf_counter() - started) * 1000, 3),
            },
        )
        return extraction

    @staticmethod
    def log_failure(error: AnalysisError, started: float, metadata: dict) -> None:
        logger.warning(
            "ai_request_failed",
            extra={
                **metadata,
                "success": False,
                "error_category": error.code,
                "latency_ms": round((perf_counter() - started) * 1000, 3),
            },
        )

    @staticmethod
    def raise_upstream_error(status: int) -> None:
        if status in {401, 403}:
            raise AnalysisError(
                503,
                "provider_auth_error",
                "Konfigurasi akses AI ditolak. Hubungi pengelola backend.",
            )
        if status == 429:
            raise AnalysisError(
                503, "provider_rate_limited", "Kuota AI sedang terbatas. Coba beberapa saat lagi."
            )
        if status in {408, 504}:
            raise AnalysisError(
                504, "provider_timeout", "AI tidak merespons tepat waktu. Coba kembali."
            )
        if status == 404:
            raise AnalysisError(
                503,
                "provider_model_unavailable",
                "Model AI tidak tersedia. Periksa GEMINI_MODEL pada backend.",
            )
        raise AnalysisError(
            502, "provider_error", "Penyedia AI gagal memproses permintaan. Coba kembali."
        )
