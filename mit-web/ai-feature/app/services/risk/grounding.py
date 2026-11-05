import re
import unicodedata

from app.schemas.recognition import AIExtraction, Evidence, Indicator, IndicatorCode, IndicatorState
from app.services.risk.scoring import LABELS, WEIGHTS

NEGATED_REQUESTS = {
    IndicatorCode.UPFRONT_PAYMENT: re.compile(
        r"\b(?:(?:tidak\s+(?:ada|dipungut|dikenakan|meminta|perlu\s+membayar)|tanpa)"
        r"\s+(?:\w+\s+){0,2}(?:biaya|pungutan|pembayaran)\b"
        r"|jangan\s+(?:pernah\s+)?(?:bayar|membayar|transfer|mentransfer)\b[^.;!?]{0,60})"
    ),
    IndicatorCode.CREDENTIAL_REQUEST: re.compile(
        r"\b(?:jangan|tidak\s+perlu)\s+(?:pernah\s+)?"
        r"(?:bagikan|berikan|kirimkan|kirim|memberikan|membagikan)\b"
        r"[^.;!?]{0,90}\b(?:otp|pin|password|kata\s+sandi)\b"
    ),
}


def normalize_text(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def has_useful_content(text: str) -> bool:
    return len(text.strip()) >= 40 and len(re.findall(r"\w+", text)) >= 6


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
    extraction: AIExtraction, text: str, *, has_image: bool, sufficient: bool
) -> tuple[list[Indicator], bool]:
    sources = {"text": normalize_text(text)}
    if has_image:
        sources["image"] = normalize_text(extraction.image_text)
    results = []
    rejected = False
    for code, weight in WEIGHTS.items():
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
        if not sufficient:
            state = IndicatorState.UNCERTAIN
            reason = "Materi belum cukup untuk menyimpulkan indikator ini."
        elif detected:
            state = IndicatorState.DETECTED
            reason = (
                f"Ada kutipan yang mendukung indikasi {LABELS[code]}; konteks perlu diverifikasi."
            )
        elif uncertain:
            state = IndicatorState.UNCERTAIN
            reason = "Indikasi belum didukung bukti yang cukup dan tidak menambah skor."
        else:
            state = IndicatorState.NOT_DETECTED
            reason = "Tidak ditemukan pada materi yang terbaca; bukan jaminan lowongan aman."
        results.append(
            Indicator(
                code=code,
                state=state,
                weight=weight,
                evidence=list(unique.values())[:6],
                reason=reason,
            )
        )
    return results, rejected
