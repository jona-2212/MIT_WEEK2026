from app.schemas.recognition import (
    AnalysisResponse,
    AnalyzeInput,
    FraudAssessment,
    IndicatorState,
    LegalScreening,
)
from app.services.ai.gemini import GeminiProvider
from app.services.knowledge.retrieval import KnowledgeRetriever, grounded_query
from app.services.risk.grounding import ground_indicators
from app.services.uploads import ValidatedImage

DISCLAIMER = (
    "Kategori ini adalah penilaian indikatif Jeli AI atas materi yang dikirim. "
    "Hasil AI dapat keliru. Verifikasi melalui sumber resmi secara mandiri."
)


class RecognitionService:
    def __init__(self, provider: GeminiProvider, knowledge: KnowledgeRetriever) -> None:
        self.provider = provider
        self.knowledge = knowledge

    async def analyze(
        self, data: AnalyzeInput, image: ValidatedImage | None, request_id: str
    ) -> AnalysisResponse:
        extraction = await self.provider.extract(data.text, image)
        sufficient = extraction.is_job_related and extraction.sufficient_content
        indicators, rejected = ground_indicators(
            extraction, data.text, has_image=image is not None, sufficient=sufficient
        )
        category = extraction.risk_category
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
            "Materi di luar teks/gambar/tautan yang Anda kirim tidak diperiksa.",
        ]
        if data.url is not None:
            unknowns.append(
                "Teks lowongan diperoleh dari ekstraksi otomatis halaman web publik."
            )
        if image is not None:
            unknowns.append(
                "Pembacaan gambar berasal dari AI dan belum diverifikasi oleh OCR independen."
            )
        summary = extraction.summary
        if rejected:
            warning = "Sebagian kutipan AI tidak cocok dengan sumber dan dikeluarkan dari bukti."
            unknowns.append(warning)
            summary = f"{summary} {warning}"
        if any(item.state == IndicatorState.UNCERTAIN for item in indicators):
            unknowns.append("Ada indikator yang masih tidak pasti dan perlu bukti tambahan.")
        return AnalysisResponse(
            request_id=request_id,
            status="insufficient_data" if category == "insufficient_data" else "completed",
            input_mode=data.input_mode,
            fraud_assessment=FraudAssessment(
                risk_category=category,
                summary=summary,
                indicators=indicators,
                unknowns=unknowns,
                recommendations=list(dict.fromkeys(extraction.recommendations)),
            ),
            legal_screening=legal,
            disclaimer=DISCLAIMER,
        )
