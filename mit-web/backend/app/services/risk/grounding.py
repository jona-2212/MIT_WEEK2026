import re
import unicodedata

from app.schemas.recognition import AIExtraction, Evidence, Indicator, IndicatorCode, IndicatorState

LABELS_ID = {
    IndicatorCode.UPFRONT_PAYMENT: "permintaan pembayaran di muka",
    IndicatorCode.CREDENTIAL_REQUEST: "permintaan OTP, PIN, atau password",
    IndicatorCode.PREMATURE_SENSITIVE_DATA: "permintaan data sensitif terlalu dini",
    IndicatorCode.URGENCY_PRESSURE: "tekanan untuk segera bertindak",
    IndicatorCode.UNREALISTIC_OFFER: "tawaran yang tidak wajar dalam konteks pekerjaan",
    IndicatorCode.UNOFFICIAL_CHANNEL: "kanal perekrut yang meragukan dengan indikasi pendukung",
}

LABELS_EN = {
    IndicatorCode.UPFRONT_PAYMENT: "upfront payment request",
    IndicatorCode.CREDENTIAL_REQUEST: "credential, OTP, PIN, or password request",
    IndicatorCode.PREMATURE_SENSITIVE_DATA: "premature sensitive personal data request",
    IndicatorCode.URGENCY_PRESSURE: "urgency pressure or prohibition to verify",
    IndicatorCode.UNREALISTIC_OFFER: "unrealistic salary or job offer",
    IndicatorCode.UNOFFICIAL_CHANNEL: "suspicious or unofficial communication channel",
}

LABELS = LABELS_ID

NEGATED_REQUESTS = {
    IndicatorCode.UPFRONT_PAYMENT: re.compile(
        r"\b(?:(?:tidak\s+(?:ada|dipungut|memungut|dikenakan|meminta|perlu\s+membayar)|tanpa)"
        r"\s+(?:\w+\s+){0,2}(?:biaya|pungutan|pembayaran)\b"
        r"|jangan\s+(?:pernah\s+)?(?:bayar|membayar|transfer|mentransfer)\b[^.;!?]{0,60})"
    ),
    IndicatorCode.CREDENTIAL_REQUEST: re.compile(
        r"\b(?:(?:jangan|tidak\s+perlu)\s+(?:pernah\s+)?"
        r"(?:bagikan|berikan|kirimkan|kirim|memberikan|membagikan)"
        r"|tidak\s+(?:pernah\s+)?(?:meminta|menerima))\b"
        r"[^.;!?]{0,90}\b(?:otp|pin|password|kata\s+sandi)\b"
    ),
}


def normalize_text(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def supported_quote(code: IndicatorCode, quote: str, source: str) -> bool:
    if len(quote) < 8 or len(quote.split()) < 2:
        return False
    negation = NEGATED_REQUESTS.get(code)
    negated_spans = list(negation.finditer(source)) if negation else []
    return any(
        not any(match.start() < span.end() and span.start() < match.end() for span in negated_spans)
        for match in re.finditer(re.escape(quote), source)
    )


def ground_indicators(
    extraction: AIExtraction,
    text: str,
    *,
    has_image: bool,
    sufficient: bool,
    lang: str = "ID",
) -> tuple[list[Indicator], bool]:
    sources = {"text": normalize_text(text)}
    if has_image:
        sources["image"] = normalize_text(extraction.image_text)
    results = []
    rejected = False
    is_en = lang == "EN"
    labels = LABELS_EN if is_en else LABELS_ID

    for code in IndicatorCode:
        observations = [item for item in extraction.indicators if item.code == code]
        evidence: list[Evidence] = []
        detected = False
        uncertain = not observations
        for item in observations:
            supported = []
            for quote in item.evidence:
                normalized = normalize_text(quote.quote)
                # Kutipan satu istilah seperti "OTP" saja tidak cukup sebagai bukti permintaan.
                if supported_quote(code, normalized, sources.get(quote.source, "")):
                    supported.append(quote)
                else:
                    rejected = True
            if item.state == IndicatorState.DETECTED:
                if supported:
                    detected = True
                    evidence.extend(supported)
                else:
                    uncertain = True
            elif item.state == IndicatorState.UNCERTAIN:
                uncertain = True
                evidence.extend(supported)
        unique = {(item.source, normalize_text(item.quote)): item for item in evidence}
        uncertain = uncertain or (
            detected and any(i.state == IndicatorState.NOT_DETECTED for i in observations)
        )
        if not sufficient:
            state = IndicatorState.UNCERTAIN
            reason = (
                "Material is insufficient to conclude this indicator."
                if is_en
                else "Materi belum cukup untuk menyimpulkan indikator ini."
            )
        elif detected and not any(i.state == IndicatorState.NOT_DETECTED for i in observations):
            state = IndicatorState.DETECTED
            reason = (
                f"Evidence found supporting indication of {labels[code]}; "
                "context requires verification."
                if is_en
                else f"Ada kutipan yang mendukung indikasi {labels[code]}; "
                "konteks perlu diverifikasi."
            )
        elif uncertain:
            state = IndicatorState.UNCERTAIN
            reason = (
                "Indication is not yet supported by sufficient evidence "
                "or extracted results conflict."
                if is_en
                else "Indikasi belum didukung bukti yang cukup atau hasil ekstraksi bertentangan."
            )
        else:
            state = IndicatorState.NOT_DETECTED
            reason = (
                "Not found in the readable material; not a guarantee that the job is safe."
                if is_en
                else "Tidak ditemukan pada materi yang terbaca; bukan jaminan lowongan aman."
            )
        results.append(
            Indicator(
                code=code,
                state=state,
                evidence=list(unique.values())[:6],
                reason=reason,
            )
        )
    return results, rejected
