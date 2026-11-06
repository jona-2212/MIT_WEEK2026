"""Rubrik kualitatif awal; nama modul lama dipertahankan untuk patch kecil.

Tidak menghitung angka, probabilitas, ataupun validitas hukum.
"""

from collections.abc import Sequence

from app.schemas.recognition import Indicator, IndicatorCode, IndicatorState, RiskCategory

LABELS = {
    IndicatorCode.UPFRONT_PAYMENT: "permintaan pembayaran di muka",
    IndicatorCode.CREDENTIAL_REQUEST: "permintaan OTP, PIN, atau password",
    IndicatorCode.PREMATURE_SENSITIVE_DATA: "permintaan data sensitif terlalu dini",
    IndicatorCode.URGENCY_PRESSURE: "tekanan untuk segera bertindak",
    IndicatorCode.UNREALISTIC_OFFER: "tawaran yang tidak wajar dalam konteks pekerjaan",
    IndicatorCode.UNOFFICIAL_CHANNEL: "kanal perekrut yang meragukan dengan indikasi pendukung",
}


DANGEROUS = {IndicatorCode.UPFRONT_PAYMENT, IndicatorCode.CREDENTIAL_REQUEST}


def validate_category(
    proposed: RiskCategory,
    indicators: Sequence[Indicator],
    *,
    sufficient: bool,
    rejected_evidence: bool = False,
) -> RiskCategory:
    if not sufficient or rejected_evidence or proposed == "insufficient_data":
        return "insufficient_data"
    if any(i.state == IndicatorState.DETECTED and not i.evidence for i in indicators):
        return "insufficient_data"
    detected = [i for i in indicators if i.state == IndicatorState.DETECTED and i.evidence]
    if any(i.code in DANGEROUS for i in detected):
        expected = "high"
    elif any(i.state == IndicatorState.UNCERTAIN for i in indicators):
        return "insufficient_data"
    elif not detected:
        if {i.code for i in indicators} != set(IndicatorCode):
            return "insufficient_data"
        expected = "low"
    else:
        independent: list[str] = []
        for item in detected:
            for evidence in item.evidence:
                quote = " ".join(evidence.quote.casefold().split())
                if not any(quote in prior or prior in quote for prior in independent):
                    independent.append(quote)
                    break
        if len({i.code for i in detected}) < 2 or len(independent) < 2:
            return "insufficient_data"
        expected = "medium"
    return proposed if proposed == expected else "insufficient_data"
