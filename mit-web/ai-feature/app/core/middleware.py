import logging
from time import perf_counter
from uuid import UUID, uuid4

from fastapi.routing import iter_route_contexts
from starlette.datastructures import Headers, MutableHeaders
from starlette.requests import Request
from starlette.routing import Match
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import error_response
from app.core.logging import request_id_context

logger = logging.getLogger("job_scam_guardian.requests")


def resolve_request_id(scope: Scope) -> str:
    supplied = Headers(scope=scope).get("X-Request-ID", "")
    if len(supplied) == 36:
        try:
            return str(UUID(supplied))
        except ValueError:
            pass
    return str(uuid4())


def resolve_log_path(scope: Scope) -> str:
    # Konteks route mempertahankan prefix include_router; jangan log path input mentah.
    partial_path = "<unmatched>"
    for route in iter_route_contexts(scope["app"].routes):
        match, _ = route.matches(scope)
        if match == Match.FULL:
            return route.path_format or "<unmatched>"
        if match == Match.PARTIAL and partial_path == "<unmatched>":
            partial_path = route.path_format or "<unmatched>"
    return partial_path


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = resolve_request_id(scope)
        scope.setdefault("state", {})["request_id"] = request_id
        token = request_id_context.set(request_id)
        started = perf_counter()
        status_code = 500

        async def send_with_request_id(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                MutableHeaders(scope=message)["X-Request-ID"] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            try:
                method = scope["method"]
                logger.info(
                    "http_request_completed",
                    extra={
                        "component": "http",
                        "method": method
                        if method in {"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
                        else "OTHER",
                        # Template route, bukan URL mentah/query yang mungkin mengandung PII.
                        "path": resolve_log_path(scope),
                        "status_code": status_code,
                        "duration_ms": round((perf_counter() - started) * 1000, 3),
                        "success": status_code < 500,
                    },
                )
            finally:
                request_id_context.reset(token)


class SafeErrorMiddleware:
    """Tangani kegagalan endpoint sebelum respons melewati lapisan CORS."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        response_started = False

        async def track_response(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, track_response)
        except Exception as exc:
            logger.error(
                "http_request_failed",
                extra={"component": "http", "error_category": type(exc).__name__},
            )
            if response_started:
                # Respons streaming/background yang sudah dikirim tidak dapat diganti.
                raise
            response = error_response(
                Request(scope), 500, "internal_error", "Terjadi kesalahan pada server."
            )
            await response(scope, receive, send)
