from fastapi import APIRouter, Request

from app import __version__
from app.schemas.errors import ErrorResponse
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Periksa apakah proses aplikasi berjalan",
    description="Liveness proses saja; tidak memeriksa penyedia AI atau layanan eksternal.",
    responses={
        200: {
            "headers": {
                "X-Request-ID": {
                    "description": "UUID untuk korelasi request dan log.",
                    "schema": {"type": "string", "format": "uuid"},
                }
            }
        },
        500: {"model": ErrorResponse, "description": "Kegagalan internal yang disanitasi."},
    },
)
async def health(request: Request) -> HealthResponse:
    return HealthResponse(service=request.app.state.settings.app_name, version=__version__)
