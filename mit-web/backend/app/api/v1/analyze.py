from fastapi import APIRouter, Request
from starlette.concurrency import run_in_threadpool

from app.core.errors import AnalysisError
from app.schemas.errors import ErrorResponse
from app.schemas.recognition import AnalysisResponse, IndicatorCode
from app.services.recognition import DISCLAIMER
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
    "analysis_version": "recognition-v2",
    "fraud_assessment": {
        "risk_category": "high",
        "summary": "Contoh sintetis MOCK, bukan hasil inferensi Gemini live.",
        "indicators": [
            {
                "code": code,
                "state": "detected" if code in EXAMPLE_QUOTES else "not_detected",
                "evidence": [{"source": "text", "quote": EXAMPLE_QUOTES[code]}]
                if code in EXAMPLE_QUOTES
                else [],
                "reason": "Ilustrasi kontrak; lihat kutipan dan batas pemeriksaan.",
            }
            for code in IndicatorCode
        ],
        "unknowns": ["Identitas perekrut belum diverifikasi secara independen."],
        "recommendations": ["Jangan transfer sebelum verifikasi melalui kanal resmi."],
    },
    "legal_screening": {
        "status": "reference_unavailable",
        "summary": "Indeks resmi belum tersedia.",
        "references": [],
        "missing_facts": [],
        "warnings": ["legal_index_missing"],
    },
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
            "fraud_assessment.risk_category=insufficient_data. "
            "Hasil legal terpisah dan tidak menentukan kategori fraud."
        ),
        "content": {
            "application/json": {
                "examples": {
                    "completed": {
                        "summary": "MOCK high; indeks resmi belum tersedia",
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
        "Kirim text, url, file JPEG/PNG/WebP, atau kombinasinya. Teks maksimal 12.000 karakter; "
        "satu gambar maksimal 5 MiB lokal / 4 MiB profil Vercel dan 16 megapiksel. "
        "Jika menyertakan url, sistem akan mengekstrak konten halaman web secara otomatis. "
        "Total multipart juga dibatasi. Input diproses secara aman oleh AI backend. "
        "Samarkan data pribadi. Jeli AI menilai risiko secara kualitatif berdasarkan konteks."
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
                                "description": "Teks lowongan atau catatan tambahan.",
                            },
                            "url": {
                                "type": "string",
                                "maxLength": 2048,
                                "description": "Tautan URL publik lowongan kerja yang akan diekstrak.",
                            },
                            "file": {
                                "type": "string",
                                "format": "binary",
                                "description": "JPEG/PNG/WebP, 5 MiB lokal atau 4 MiB Vercel.",
                            },
                            "lang": {
                                "type": "string",
                                "enum": ["ID", "EN"],
                                "default": "ID",
                                "description": "Bahasa output analisis (ID atau EN).",
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
    image = (
        await run_in_threadpool(
            validate_image, *upload, max_bytes=request.app.state.settings.max_image_bytes
        )
        if upload is not None
        else None
    )
    service = getattr(request.app.state, "recognition_service", None)
    if service is None:
        raise AnalysisError(503, "service_not_ready", "Aplikasi belum siap memproses analisis.")
    return await service.analyze(data, image, request.state.request_id)
