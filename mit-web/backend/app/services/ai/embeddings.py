"""Embedding REST; tidak dipanggil pada startup atau tes default."""

import asyncio
import json
import logging
import math
from collections.abc import Sequence
from time import perf_counter
from typing import Protocol

import httpx

from app.core.config import Settings

logger = logging.getLogger("job_scam_guardian.embeddings")


class EmbeddingError(ValueError):
    """Kode aman; tidak membawa body provider atau isi query."""


def normalize_vector(values: object, dimensions: int) -> list[float]:
    if not isinstance(values, list) or len(values) != dimensions:
        raise EmbeddingError("embedding_dimension_mismatch")
    if any(type(v) not in {int, float} or not math.isfinite(v) for v in values):
        raise EmbeddingError("embedding_invalid_vector")
    norm = math.hypot(*values)
    if not math.isfinite(norm) or norm == 0:
        raise EmbeddingError("embedding_invalid_vector")
    return [float(v) / norm for v in values]


class EmbeddingProvider(Protocol):
    model_id: str
    dimensions: int

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]: ...

    async def embed_query(self, text: str) -> list[float]: ...


class GeminiEmbeddingProvider:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self.settings = settings
        self.client = client
        self.model_id = settings.embedding_model
        self.dimensions = settings.embedding_dimensions

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        # Satu HTTP request per chunk; tanpa retry tersembunyi.
        return [await self._embed(text, "RETRIEVAL_DOCUMENT") for text in texts]

    async def embed_query(self, text: str) -> list[float]:
        return await self._embed(text, "RETRIEVAL_QUERY")

    async def _embed(self, text: str, task: str) -> list[float]:
        started = perf_counter()
        metadata = {"component": "legal_embedding", "provider": "gemini", "model": self.model_id}
        try:
            if self.settings.gemini_api_key is None:
                raise EmbeddingError("embedding_not_configured")
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.model_id}:embedContent"
            )
            async with asyncio.timeout(self.settings.embedding_timeout_seconds):
                async with self.client.stream(
                    "POST",
                    url,
                    headers={"x-goog-api-key": self.settings.gemini_api_key.get_secret_value()},
                    json={
                        "model": f"models/{self.model_id}",
                        "content": {"parts": [{"text": text}]},
                        "taskType": task,
                        "outputDimensionality": self.dimensions,
                    },
                ) as response:
                    if response.status_code != 200:
                        category = {
                            429: "embedding_rate_limited",
                            401: "embedding_auth_error",
                            403: "embedding_auth_error",
                            408: "embedding_timeout",
                            504: "embedding_timeout",
                        }.get(response.status_code, "embedding_unavailable")
                        raise EmbeddingError(category)
                    body = bytearray()
                    async for chunk in response.aiter_bytes():
                        body.extend(chunk)
                        if len(body) > 128 * 1024:
                            raise EmbeddingError("embedding_invalid_response")
            try:
                values = json.loads(body)["embedding"]["values"]
                result = normalize_vector(values, self.dimensions)
            except (KeyError, TypeError, ValueError, OverflowError):
                raise EmbeddingError("embedding_invalid_response") from None
        except (TimeoutError, httpx.TimeoutException):
            self._log(started, metadata, "embedding_timeout")
            raise EmbeddingError("embedding_timeout") from None
        except httpx.HTTPError:
            self._log(started, metadata, "embedding_unavailable")
            raise EmbeddingError("embedding_unavailable") from None
        except EmbeddingError as error:
            self._log(started, metadata, str(error))
            raise
        self._log(started, metadata)
        return result

    @staticmethod
    def _log(started: float, metadata: dict, error: str | None = None) -> None:
        logger.log(
            logging.WARNING if error else logging.INFO,
            "embedding_request_failed" if error else "embedding_request_completed",
            extra={
                **metadata,
                "success": error is None,
                "error_category": error,
                "latency_ms": round((perf_counter() - started) * 1000, 3),
            },
        )
