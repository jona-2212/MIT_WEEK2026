from fastapi import APIRouter, Request
from starlette.concurrency import run_in_threadpool

from app.core.errors import AnalysisError
from app.schemas.errors import ErrorResponse
from app.schemas.recognition import AnalysisResponse
from app.services.recognition import DISCLAIMER
from app.services.risk.scoring import WEIGHTS
from app.services.uploads import read_analyze_form, validate_image

router = APIRouter(tags=["Recognition"])
EXAMPLE_QUOTES = {
    "upfront_payment": "Transfer biaya administrasi Rp150.000",
    "urgency_pressure": "Konfirmasi hari ini juga",
}
COMPLETED_EXAMPLE = {
    "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808",
    "status": "completed",
    "input_mode": "text",
    "analysis_version": "recognition-v1",
    "scoring_version": "rules-v1",
    "risk_score": 55,
    "risk_level": "high",
    "score_breakdown": {
        "raw_score": 55,
        "final_score": 55,
        "contributions": [
            {"code": "upfront_payment", "weight": 40},
            {"code": "urgency_pressure", "weight": 15},
        ],
    },
    "summary": "Contoh sintetis untuk dokumentasi, bukan hasil inferensi Gemini live.",
    "indicators": [
        {
            "code": code,
            "state": "detected" if code in EXAMPLE_QUOTES else "not_detected",
            "weight": weight,
            "evidence": [{"source": "text", "quote": EXAMPLE_QUOTES[code]}]
            if code in EXAMPLE_QUOTES
            else [],
            "reason": "Ilustrasi kontrak; lihat kutipan dan batas pemeriksaan.",
        }
        for code, weight in WEIGHTS.items()
    ],
    "unknowns": ["Identitas perekrut belum diverifikasi secara independen."],
    "recommendations": ["Verifikasi lewat kanal resmi perusahaan yang ditemukan secara mandiri."],
    "legal_status": "not_available",
    "legal_context": [],
    "disclaimer": DISCLAIMER,
}
ERROR_RESPONSES = {
    code: {"model": ErrorResponse, "description": description}
    for code, description in {
        400: "Input kosong atau upload terputus.",
        413: "Ukuran payload/gambar atau dimensi terlalu besar.",
        415: "Format request/gambar atau isi gambar tidak didukung.",
        422: "Form atau panjang teks tidak valid.",
        502: "Hasil/kegagalan penyedia AI tidak dapat diproses.",
        503: "Provider belum dikonfigurasi, tidak tersedia, atau kuota terbatas.",
        504: "Batas waktu AI terlampaui.",
    }.items()
}
RESPONSES = {
    **ERROR_RESPONSES,
    200: {
        "description": (
            "Contoh completed di bawah bersifat sintetis. Untuk insufficient_data, "
            "risk_score dan score_breakdown.final_score bernilai null, "
            "risk_level=insufficient_data, contributions kosong."
        ),
        "content": {
            "application/json": {
                "examples": {
                    "completed": {
                        "summary": "Contoh sintetis 55/high; KB tidak tersedia",
                        "value": COMPLETED_EXAMPLE,
                    },
                }
            }
        },
    },
}


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    responses=RESPONSES,
    summary="Analisis indikasi risiko satu kasus rekrutmen",
    description=(
        "Kirim text, file JPEG/PNG/WebP, atau keduanya. Teks maksimal 12.000 karakter; "
        "satu gambar maksimal 5 MiB dan 16 megapiksel. Input diproses pihak ketiga (Gemini). "
        "Samarkan data pribadi. Skor heuristik dihitung Python; bukan probabilitas penipuan."
    ),
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "text": {
                                "type": "string",
                                "maxLength": 12000,
                                "description": "Teks lowongan; dapat dikosongkan bila ada file.",
                            },
                            "file": {
                                "type": "string",
                                "format": "binary",
                                "description": "Satu JPEG/PNG/WebP, maksimal 5 MiB.",
                            },
                        },
                    },
                    "examples": {
                        "text_only": {
                            "summary": "Teks saja",
                            "value": {
                                "text": (
                                    "Lowongan staf toko. Transfer biaya administrasi "
                                    "sebelum wawancara hari ini."
                                )
                            },
                        },
                        "image_only": {
                            "summary": "Gambar saja",
                            "description": "Pilih file di Swagger; kosongkan text.",
                        },
                        "combined": {
                            "summary": "Satu kasus teks + gambar",
                            "description": (
                                "Isi text dan pilih file; indikator sama dihitung sekali."
                            ),
                        },
                    },
                }
            },
        }
    },
)
async def analyze(request: Request) -> AnalysisResponse:
    data, upload = await read_analyze_form(request)
    image = await run_in_threadpool(validate_image, *upload) if upload is not None else None
    service = getattr(request.app.state, "recognition_service", None)
    if service is None:
        raise AnalysisError(503, "service_not_ready", "Aplikasi belum siap memproses analisis.")
    return await service.analyze(data, image, request.state.request_id)
