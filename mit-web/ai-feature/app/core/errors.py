from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.schemas.errors import ErrorDetail, ErrorResponse


class AnalysisError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(code)


async def analysis_error_handler(request: Request, exc: AnalysisError) -> JSONResponse:
    return error_response(request, exc.status_code, exc.code, exc.message)


def error_response(request: Request, status_code: int, code: str, message: str) -> JSONResponse:
    request_id = request.state.request_id
    payload = ErrorResponse(
        request_id=request_id, error=ErrorDetail(code=code, message=message, request_id=request_id)
    )
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(),
        headers={"X-Request-ID": request_id},
    )


async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    messages = {
        400: "Permintaan tidak valid.",
        404: "Endpoint tidak ditemukan.",
        405: "Metode HTTP tidak diizinkan.",
        413: "Ukuran permintaan terlalu besar.",
        415: "Tipe media tidak didukung.",
        429: "Terlalu banyak permintaan.",
    }
    response = error_response(
        request,
        exc.status_code,
        "http_error",
        messages.get(exc.status_code, "Permintaan tidak dapat diproses."),
    )
    if exc.headers:
        response.headers.update(exc.headers)
    return response


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Jangan menyalin exc.errors(): elemen input dapat memuat data pribadi.
    return error_response(request, 422, "validation_error", "Data permintaan tidak valid.")
