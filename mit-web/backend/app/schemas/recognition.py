from datetime import date
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class IndicatorCode(StrEnum):
    UPFRONT_PAYMENT = "upfront_payment"
    CREDENTIAL_REQUEST = "credential_request"
    PREMATURE_SENSITIVE_DATA = "premature_sensitive_data"
    URGENCY_PRESSURE = "urgency_pressure"
    UNREALISTIC_OFFER = "unrealistic_offer"
    UNOFFICIAL_CHANNEL = "unofficial_channel"


class IndicatorState(StrEnum):
    DETECTED = "detected"
    UNCERTAIN = "uncertain"
    NOT_DETECTED = "not_detected"


class AnalyzeInput(StrictModel):
    text: str = Field(default="", max_length=12_000, repr=False)
    has_image: bool = False

    @model_validator(mode="after")
    def require_content(self) -> "AnalyzeInput":
        if not self.text and not self.has_image:
            raise ValueError("Teks atau gambar diperlukan.")
        return self

    @property
    def input_mode(self) -> Literal["text", "image", "both"]:
        if self.text and self.has_image:
            return "both"
        return "image" if self.has_image else "text"


class Evidence(StrictModel):
    source: Literal["text", "image"]
    quote: str = Field(min_length=1, max_length=600, repr=False)


class ExtractedIndicator(StrictModel):
    code: IndicatorCode
    state: IndicatorState
    evidence: list[Evidence] = Field(max_length=6)


RiskCategory = Literal["high", "medium", "low", "insufficient_data"]
LegalTopic = Literal["recruitment_fees", "personal_data", "employment_terms"]


class LegalObservation(StrictModel):
    topic: LegalTopic
    evidence: list[Evidence] = Field(min_length=1, max_length=6)


class AIExtraction(StrictModel):
    is_job_related: StrictBool
    sufficient_content: StrictBool
    image_text: str = Field(max_length=16_000, repr=False)
    indicators: list[ExtractedIndicator] = Field(max_length=12)
    risk_category: RiskCategory
    summary: str = Field(min_length=1, max_length=800, repr=False)
    recommendations: list[Annotated[str, Field(min_length=1, max_length=300)]] = Field(
        min_length=1, max_length=5, repr=False
    )
    legal_observations: list[LegalObservation] = Field(max_length=6)


class Indicator(ExtractedIndicator):
    reason: str


class LegalReference(StrictModel):
    source_id: str
    source_kind: Literal["official", "test_fixture"]
    chunk_id: str
    type: Literal["regulation", "official_guidance"]
    title: str
    article: str | None
    official_url: str
    excerpt: str = Field(min_length=1, max_length=1800)
    page_start: int = Field(ge=1)
    page_end: int = Field(ge=1)
    document_version: str
    verification_status: Literal["verified"] = "verified"
    verified_at: date
    review_after: date
    pdf_sha256: str
    index_sha256: str
    scope: str
    exceptions: str


class FraudAssessment(StrictModel):
    risk_category: RiskCategory
    summary: str
    indicators: list[Indicator]
    unknowns: list[str]
    recommendations: list[str]


class LegalScreening(StrictModel):
    status: Literal[
        "potential_issue", "needs_more_context", "no_relevant_reference", "reference_unavailable"
    ]
    summary: str
    references: list[LegalReference] = Field(default_factory=list, max_length=10)
    missing_facts: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def consistent_references(self) -> "LegalScreening":
        if self.status in {"reference_unavailable", "no_relevant_reference"} and self.references:
            raise ValueError("Status tidak boleh memuat rujukan.")
        if self.status == "potential_issue" and not self.references:
            raise ValueError("Potensi isu memerlukan rujukan.")
        if self.status == "needs_more_context" and not self.missing_facts:
            raise ValueError("Fakta yang kurang wajib dijelaskan.")
        return self


class AnalysisResponse(StrictModel):
    request_id: str
    status: Literal["completed", "insufficient_data"]
    input_mode: Literal["text", "image", "both"]
    analysis_version: Literal["recognition-v2"] = "recognition-v2"
    fraud_assessment: FraudAssessment
    legal_screening: LegalScreening
    disclaimer: str

    @model_validator(mode="after")
    def consistent_category(self) -> "AnalysisResponse":
        if (self.status == "insufficient_data") != (
            self.fraud_assessment.risk_category == "insufficient_data"
        ):
            raise ValueError("Status dan level tidak konsisten.")
        return self
