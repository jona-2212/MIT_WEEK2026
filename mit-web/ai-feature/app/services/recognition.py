from app.schemas.recognition import (
    AIExtraction,
    AnalysisResponse,
    AnalyzeInput,
    IndicatorCode,
    IndicatorState,
)
from app.services.ai.gemini import GeminiProvider
from app.services.knowledge.retrieval import KnowledgeRetriever
from app.services.risk.grounding import ground_indicators, has_useful_content
from app.services.risk.scoring import LABELS, risk_level_for_score, score_indicators
from app.services.uploads import ValidatedImage

DISCLAIMER = (
    "Skor ini adalah indikator heuristik, bukan persentase peluang penipuan, putusan hukum, "
    "atau jaminan keamanan. Hasil AI dapat keliru; verifikasi melalui sumber resmi secara mandiri."
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
                is_job_related=False, sufficient_content=False, image_text="", indicators=[]
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
        breakdown = score_indicators(indicators, sufficient=sufficient)
        detected = [item.code for item in indicators if item.state == IndicatorState.DETECTED]
        references = self.knowledge.retrieve(detected)
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
            unknowns.append("Ada indikator yang masih tidak pasti dan tidak dimasukkan ke skor.")
        recommendations = [RECOMMENDATIONS[code] for code in detected]
        recommendations.append(
            "Periksa situs dan kanal resmi perusahaan secara mandiri sebelum melanjutkan."
        )
        if not sufficient:
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
            status="completed" if sufficient else "insufficient_data",
            input_mode=data.input_mode,
            risk_score=breakdown.final_score,
            risk_level=risk_level_for_score(breakdown.final_score)
            if sufficient
            else "insufficient_data",
            score_breakdown=breakdown,
            summary=summary,
            indicators=indicators,
            unknowns=unknowns,
            recommendations=list(dict.fromkeys(recommendations)),
            legal_status="available" if references else "not_available",
            legal_context=references,
            disclaimer=DISCLAIMER,
        )
