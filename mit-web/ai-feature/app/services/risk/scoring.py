from collections.abc import Sequence
from typing import Literal

from app.schemas.recognition import (
    Indicator,
    IndicatorCode,
    IndicatorState,
    ScoreBreakdown,
    ScoreContribution,
)

SCORING_VERSION = "rules-v1"
WEIGHTS: dict[IndicatorCode, int] = {
    IndicatorCode.UPFRONT_PAYMENT: 40,
    IndicatorCode.CREDENTIAL_REQUEST: 40,
    IndicatorCode.PREMATURE_SENSITIVE_DATA: 20,
    IndicatorCode.URGENCY_PRESSURE: 15,
    IndicatorCode.UNREALISTIC_OFFER: 10,
    IndicatorCode.UNOFFICIAL_CHANNEL: 10,
}
LABELS = {
    IndicatorCode.UPFRONT_PAYMENT: "permintaan pembayaran di muka",
    IndicatorCode.CREDENTIAL_REQUEST: "permintaan OTP, PIN, atau password",
    IndicatorCode.PREMATURE_SENSITIVE_DATA: "permintaan data sensitif terlalu dini",
    IndicatorCode.URGENCY_PRESSURE: "tekanan untuk segera bertindak",
    IndicatorCode.UNREALISTIC_OFFER: "tawaran yang tidak wajar dalam konteks pekerjaan",
    IndicatorCode.UNOFFICIAL_CHANNEL: "kanal perekrut yang meragukan dengan indikasi pendukung",
}


def risk_level_for_score(score: int) -> Literal["low", "medium", "high"]:
    if not 0 <= score <= 100:
        raise ValueError("Skor harus berada pada rentang 0–100.")
    return "low" if score < 25 else "medium" if score < 50 else "high"


def score_indicators(indicators: Sequence[Indicator], *, sufficient: bool = True) -> ScoreBreakdown:
    if not sufficient:
        return ScoreBreakdown(raw_score=0, final_score=None, contributions=[])
    detected = {
        item.code for item in indicators if item.state == IndicatorState.DETECTED and item.evidence
    }
    contributions = [
        ScoreContribution(code=code, weight=weight)
        for code, weight in WEIGHTS.items()
        if code in detected
    ]
    raw_score = sum(item.weight for item in contributions)
    return ScoreBreakdown(
        raw_score=raw_score, final_score=min(100, raw_score), contributions=contributions
    )
