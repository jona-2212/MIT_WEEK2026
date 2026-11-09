import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse
from starlette.exceptions import HTTPException
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1.analyze import router as analyze_router
from app.api.v1.health import router as health_router
from app.api.v1.roleplay import router as roleplay_router
from app.core.config import PROJECT_ROOT, Settings
from app.core.errors import (
    AnalysisError,
    analysis_error_handler,
    http_error_handler,
    validation_error_handler,
)
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware, SafeErrorMiddleware
from app.services.ai.embeddings import EmbeddingProvider, GeminiEmbeddingProvider
from app.services.ai.gemini import GeminiProvider
from app.services.knowledge.static_index import StaticKnowledgeRetriever
from app.services.recognition import RecognitionService
from app.services.roleplay import RoleplayService

logger = logging.getLogger("job_scam_guardian.lifecycle")


def create_app(
    settings: Settings | None = None,
    *,
    provider_transport: httpx.AsyncBaseTransport | None = None,
    embedding_provider: EmbeddingProvider | None = None,
) -> FastAPI:
    settings = settings if settings is not None else Settings()
    configure_logging(settings.app_name, "DEBUG" if settings.debug else settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        logger.info("application_started", extra={"component": "lifecycle"})
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.gemini_timeout_seconds, connect=15.0),
            limits=httpx.Limits(max_connections=6, max_keepalive_connections=3),
            follow_redirects=False,
            trust_env=False,
            transport=provider_transport,
        ) as provider_client:
            app.state.recognition_service = RecognitionService(
                GeminiProvider(settings, provider_client),
                StaticKnowledgeRetriever(
                    settings,
                    embedding_provider or GeminiEmbeddingProvider(settings, provider_client),
                ),
            )
            app.state.roleplay_service = RoleplayService(settings, provider_client)
            yield
        app.state.recognition_service = None
        app.state.roleplay_service = None
        logger.info("application_stopped", extra={"component": "lifecycle"})

    application = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "Analisis indikasi risiko rekrutmen berbasis Gemini "
            "dan RAG hukum JSON statis read-only. Gemini menentukan kategori risiko dari konteks."
        ),
        # DEBUG hanya mengatur level log; traceback HTTP selalu dinonaktifkan.
        debug=False,
        lifespan=lifespan,
        middleware=[
            Middleware(RequestContextMiddleware),
            Middleware(
                CORSMiddleware,
                allow_origins=settings.allowed_origins,
                allow_credentials=False,
                allow_methods=["GET", "POST"],
                allow_headers=["Content-Type", "X-Request-ID"],
                expose_headers=["X-Request-ID"],
            ),
            Middleware(SafeErrorMiddleware),
        ],
    )
    application.state.settings = settings
    application.add_exception_handler(HTTPException, http_error_handler)
    application.add_exception_handler(AnalysisError, analysis_error_handler)
    application.add_exception_handler(RequestValidationError, validation_error_handler)
    application.include_router(health_router)
    application.include_router(health_router, prefix="/api/v1")
    application.include_router(analyze_router, prefix="/api/v1")
    application.include_router(roleplay_router, prefix="/api/v1")

    @application.get("/demo", include_in_schema=False)
    async def demo() -> HTMLResponse:
        return HTMLResponse(render_demo(settings))

    return application


def render_demo(settings: Settings) -> str:
    return (
        (PROJECT_ROOT / "demo/index.html")
        .read_text(encoding="utf-8")
        .replace("__MAX_IMAGE_BYTES__", str(settings.max_image_bytes))
        .replace("__MAX_REQUEST_BYTES__", str(settings.max_request_bytes))
        .replace("__UPLOAD_MIB__", str(settings.max_image_bytes // (1024 * 1024)))
    )


app = create_app()

