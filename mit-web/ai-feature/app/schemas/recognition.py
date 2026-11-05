from enum import StrEnum
from typing import Literal

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


class AIExtraction(StrictModel):
    is_job_related: StrictBool
    sufficient_content: StrictBool
    image_text: str = Field(max_length=16_000, repr=False)
    indicators: list[ExtractedIndicator] = Field(max_length=12)


class Indicator(ExtractedIndicator):
    weight: int = Field(ge=0, le=100)
    reason: str


class ScoreContribution(StrictModel):
    code: IndicatorCode
    weight: int = Field(ge=0, le=100)


class ScoreBreakdown(StrictModel):
    raw_score: int = Field(ge=0, le=135)
    final_score: int | None = Field(ge=0, le=100)
    contributions: list[ScoreContribution]


class LegalContext(StrictModel):
    source_id: str
    type: Literal["regulation", "official_guidance"]
    title: str
    article: str | None
    official_url: str
    summary: str
    verified_at: str
    exceptions: str


class AnalysisResponse(StrictModel):
    request_id: str
    status: Literal["completed", "insufficient_data"]
    input_mode: Literal["text", "image", "both"]
    analysis_version: Literal["recognition-v1"] = "recognition-v1"
    scoring_version: Literal["rules-v1"] = "rules-v1"
    risk_score: int | None = Field(ge=0, le=100)
    risk_level: Literal["low", "medium", "high", "insufficient_data"]
    score_breakdown: ScoreBreakdown
    summary: str
    indicators: list[Indicator]
    unknowns: list[str]
    recommendations: list[str]
    legal_status: Literal["available", "not_available"]
    legal_context: list[LegalContext]
    disclaimer: str

    @model_validator(mode="after")
    def consistent_score(self) -> "AnalysisResponse":
        insufficient = self.status == "insufficient_data"
        if insufficient != (self.risk_score is None):
            raise ValueError("Status dan skor tidak konsisten.")
        if insufficient != (self.risk_level == "insufficient_data"):
            raise ValueError("Status dan level tidak konsisten.")
        if self.risk_score != self.score_breakdown.final_score:
            raise ValueError("Skor final tidak konsisten.")
        if bool(self.legal_context) != (self.legal_status == "available"):
            raise ValueError("Status referensi tidak konsisten.")
        return self
