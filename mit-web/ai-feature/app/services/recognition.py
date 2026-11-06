from app.schemas.recognition import (
    AIExtraction,
    AnalysisResponse,
    AnalyzeInput,
    FraudAssessment,
    IndicatorCode,
    IndicatorState,
    LegalScreening,
)
from app.services.ai.gemini import GeminiProvider
from app.services.knowledge.retrieval import KnowledgeRetriever, grounded_query
from app.services.risk.grounding import ground_indicators, has_useful_content
from app.services.risk.scoring import LABELS, validate_category
from app.services.uploads import ValidatedImage

DISCLAIMER = (
    "Kategori ini memakai rubrik heuristik awal, bukan probabilitas, putusan hukum, "
    "atau jaminan keamanan. Low tidak berarti terverifikasi aman. "
    "Hasil AI dapat keliru; verifikasi melalui sumber resmi secara mandiri."
)
RECOMMENDATIONS = {
    IndicatorCode.UPFRONT_PAYMENT: (
        "Jangan transfer uang sebelum identitas perekrut dan rincian biaya "
        "diverifikasi secara mandiri."
    ),
    IndicatorCode.CREDENTIAL_REQUEST: (
        "Jangan membagikan OTP, PIN, atau password akun kepada perekrut."
    ),
    IndicatorCode.PREMATURE_SENSITIVE_DATA: (
        "Tanyakan tujuan dan dasar kebutuhan data; samarkan dokumen sensitif "
        "sampai proses dan identitas jelas."
    ),
    IndicatorCode.URGENCY_PRESSURE: (
        "Ambil waktu untuk memeriksa tawaran; jangan membayar atau membagikan data karena desakan."
    ),
    IndicatorCode.UNREALISTIC_OFFER: (
        "Bandingkan tugas, syarat, dan imbalan dengan informasi pekerjaan yang dapat diverifikasi."
    ),
    IndicatorCode.UNOFFICIAL_CHANNEL: (
        "Konfirmasi perekrut lewat situs atau kontak resmi perusahaan yang Anda temukan sendiri."
    ),
}


class RecognitionService:
    def __init__(self, provider: GeminiProvider, knowledge: KnowledgeRetriever) -> None:
        self.provider = provider
        self.knowledge = knowledge

    async def analyze(
        self, data: AnalyzeInput, image: ValidatedImage | None, request_id: str
    ) -> AnalysisResponse:
        if image is None and not has_useful_content(data.text):
            extraction = AIExtraction(
                is_job_related=False,
                sufficient_content=False,
                image_text="",
                indicators=[],
                proposed_category="insufficient_data",
                legal_observations=[],
            )
        else:
            extraction = await self.provider.extract(data.text, image)
        readable = data.text + ("\n" + extraction.image_text if image is not None else "")
        sufficient = (
            extraction.is_job_related
            and extraction.sufficient_content
            and has_useful_content(readable)
        )
        indicators, rejected = ground_indicators(
            extraction, data.text, has_image=image is not None, sufficient=sufficient
        )
        category = validate_category(
            extraction.proposed_category,
            indicators,
            sufficient=sufficient,
            rejected_evidence=rejected,
        )
        detected = [item.code for item in indicators if item.state == IndicatorState.DETECTED]
        query, topics = grounded_query(
            extraction, indicators, data.text, has_image=image is not None
        )
        legal = (
            await self.knowledge.retrieve(query, topics)
            if sufficient
            else LegalScreening(
                status="needs_more_context",
                summary="Materi belum cukup untuk screening hukum.",
                missing_facts=["Konteks rekrutmen dan materi yang terbaca dengan jelas."],
            )
        )
        unknowns = [
            "Identitas perekrut, perusahaan, dan keberadaan lowongan "
            "belum diverifikasi secara independen.",
            "Materi di luar teks/gambar yang Anda kirim tidak diperiksa.",
        ]
        if image is not None:
            unknowns.append(
                "Pembacaan gambar berasal dari AI dan belum diverifikasi oleh OCR independen."
            )
        if rejected:
            unknowns.append(
                "Sebagian kutipan AI tidak cocok dengan sumber "
                "sehingga tidak digunakan sebagai bukti."
            )
        if any(item.state == IndicatorState.UNCERTAIN for item in indicators):
            unknowns.append("Ada indikator yang masih tidak pasti dan perlu bukti tambahan.")
        if category == "insufficient_data" and sufficient:
            unknowns.append("Usulan kategori belum konsisten dengan bukti/rubrik yang tervalidasi.")
        recommendations = [RECOMMENDATIONS[code] for code in detected]
        recommendations.append(
            "Periksa situs dan kanal resmi perusahaan secara mandiri sebelum melanjutkan."
        )
        if category == "insufficient_data":
            summary = (
                "Materi belum cukup jelas atau belum memuat konteks rekrutmen "
                "yang memadai untuk penilaian risiko."
            )
            recommendations.insert(
                0,
                "Kirim isi lowongan yang lebih lengkap atau screenshot "
                "yang lebih tajam dan sudah disamarkan.",
            )
        elif detected:
            summary = (
                "Indikasi berbukti pada materi: "
                + ", ".join(LABELS[code] for code in detected)
                + ". Ini belum membuktikan penipuan."
            )
        else:
            summary = (
                "Belum ditemukan indikator berbukti pada materi yang terbaca. "
                "Lowongan belum terverifikasi dan tidak dinyatakan aman."
            )
        return AnalysisResponse(
            request_id=request_id,
            status="insufficient_data" if category == "insufficient_data" else "completed",
            input_mode=data.input_mode,
            fraud_assessment=FraudAssessment(
                risk_category=category,
                summary=summary,
                indicators=indicators,
                unknowns=unknowns,
                recommendations=list(dict.fromkeys(recommendations)),
            ),
            legal_screening=legal,
            disclaimer=DISCLAIMER,
        )
