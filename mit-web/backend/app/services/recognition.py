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

DISCLAIMER_ID = (
    "Kategori ini adalah penilaian indikatif Jeli AI atas materi yang dikirim. "
    "Hasil AI dapat keliru. Verifikasi melalui sumber resmi secara mandiri."
)
DISCLAIMER_EN = (
    "This category is an indicative assessment by Jeli AI based on the submitted material. "
    "AI results may be inaccurate. Independently verify through official sources."
)
DISCLAIMER = DISCLAIMER_ID


class RecognitionService:
    def __init__(self, provider: GeminiProvider, knowledge: KnowledgeRetriever) -> None:
        self.provider = provider
        self.knowledge = knowledge

    async def analyze(
        self, data: AnalyzeInput, image: ValidatedImage | None, request_id: str
    ) -> AnalysisResponse:
        is_en = data.lang == "EN"
        extraction = await self.provider.extract(data.text, image, lang=data.lang)
        sufficient = (
            extraction.is_job_related
            and extraction.sufficient_content
            and extraction.risk_category != "insufficient_data"
        )
        indicators, rejected = ground_indicators(
            extraction,
            data.text,
            has_image=image is not None,
            sufficient=sufficient,
            lang=data.lang,
        )
        category = extraction.risk_category if sufficient else "insufficient_data"
        query, topics = grounded_query(
            extraction, indicators, data.text, has_image=image is not None
        )
        legal = (
            await self.knowledge.retrieve(query, topics)
            if sufficient
            else LegalScreening(
                status="needs_more_context",
                summary=(
                    "Material is insufficient for legal screening."
                    if is_en
                    else "Materi belum cukup untuk screening hukum."
                ),
                missing_facts=[
                    "Clear recruitment context and readable material."
                    if is_en
                    else "Konteks rekrutmen dan materi yang terbaca dengan jelas."
                ],
            )
        )
        if is_en:
            unknowns = [
                "The identity of the recruiter, company, and existence "
                "of the job have not been independently verified.",
                "Materials outside the text, image, or link you submitted were not inspected.",
            ]
            if data.url is not None:
                unknowns.append("Job text was extracted automatically from a public web page.")
            if image is not None:
                unknowns.append("The AI image reading has not been verified by independent OCR.")
        else:
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
        if data.url_unreadable:
            unknowns.append(
                "The URL was not read. Only your submitted text or image was analyzed."
                if is_en
                else "Tautan belum dibaca. Analisis memakai teks atau gambar yang dikirim."
            )
        summary = extraction.summary
        recommendations = extraction.recommendations
        if not sufficient:
            summary = (
                "The material is insufficient to assess the offer."
                if is_en
                else "Materi belum cukup untuk menilai tawaran kerja."
            )
            recommendations = [
                "Submit a readable job posting or recruitment message."
                if is_en
                else "Kirim isi lowongan atau pesan rekrutmen yang terbaca."
            ]
        if rejected:
            warning = (
                "Some AI quotes did not match the source and were excluded from evidence."
                if is_en
                else "Sebagian kutipan AI tidak cocok dengan sumber dan dikeluarkan dari bukti."
            )
            unknowns.append(warning)
            summary = f"{summary} {warning}"
        if any(item.state == IndicatorState.UNCERTAIN for item in indicators):
            unknowns.append(
                "Some indicators remain uncertain and need additional verification."
                if is_en
                else "Ada indikator yang masih tidak pasti dan perlu bukti tambahan."
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
            disclaimer=DISCLAIMER_EN if is_en else DISCLAIMER_ID,
        )
