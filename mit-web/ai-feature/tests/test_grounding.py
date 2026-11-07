import pytest

from app.schemas.recognition import AIExtraction
from app.services.risk.grounding import ground_indicators
from tests.factories import SUSPICIOUS_TEXT, extraction, observation


def test_grounding_rejects_fabricated_quotes() -> None:
    model = AIExtraction.model_validate(
        extraction(observation("upfront_payment", "bayar tiket palsu"))
    )
    items, rejected = ground_indicators(model, SUSPICIOUS_TEXT, has_image=False, sufficient=True)
    assert rejected and items[0].state == "uncertain" and items[0].evidence == []


def test_grounding_combines_modalities_without_duplicate_indicators() -> None:
    model = AIExtraction.model_validate(
        extraction(
            observation("upfront_payment", "TRANSFER biaya administrasi Rp150.000"),
            observation("upfront_payment", "transfer biaya administrasi Rp150.000", "image"),
            image_text=SUSPICIOUS_TEXT,
        )
    )
    items, rejected = ground_indicators(model, SUSPICIOUS_TEXT, has_image=True, sufficient=True)
    assert not rejected and len(items[0].evidence) == 2
    assert len([i for i in items if i.state == "detected"]) == 1


@pytest.mark.parametrize(
    "code,source,quote",
    [
        (
            "upfront_payment",
            "Proses tidak dipungut biaya administrasi.",
            "dipungut biaya administrasi",
        ),
        (
            "upfront_payment",
            "Kami tidak memungut biaya administrasi.",
            "memungut biaya administrasi",
        ),
        (
            "credential_request",
            "Kami tidak pernah meminta OTP atau password pelamar.",
            "meminta OTP",
        ),
        ("upfront_payment", "Pendaftaran tanpa biaya administrasi.", "biaya administrasi"),
        (
            "upfront_payment",
            "Jangan transfer biaya kepada perekrut.",
            "transfer biaya kepada perekrut",
        ),
        ("credential_request", "Jangan bagikan OTP atau password kepada perekrut.", "bagikan OTP"),
        ("credential_request", "Jangan berikan kode OTP kepada perekrut.", "kode OTP"),
    ],
)
def test_quote_cannot_cut_out_negation(code: str, source: str, quote: str) -> None:
    model = AIExtraction.model_validate(extraction(observation(code, quote)))
    items, rejected = ground_indicators(model, source, has_image=False, sufficient=True)
    assert rejected and items[0 if code == "upfront_payment" else 1].state == "uncertain"


@pytest.mark.parametrize(
    "quote,source", [("OTP", "text"), ("transfer biaya administrasi", "image")]
)
def test_absent_source_or_one_word_quote_is_rejected(quote: str, source: str) -> None:
    model = AIExtraction.model_validate(extraction(observation("upfront_payment", quote, source)))
    items, rejected = ground_indicators(model, SUSPICIOUS_TEXT, has_image=False, sufficient=True)
    assert rejected and items[0].state == "uncertain"


def test_urgency_word_jangan_does_not_negate_real_payment() -> None:
    source = "Jangan tunda, transfer biaya administrasi sebelum wawancara sekarang juga."
    model = AIExtraction.model_validate(
        extraction(observation("upfront_payment", "transfer biaya administrasi"))
    )
    items, rejected = ground_indicators(model, source, has_image=False, sufficient=True)
    assert not rejected and items[0].state == "detected"


def test_contradictory_indicator_states_are_uncertain() -> None:
    model = AIExtraction.model_validate(
        extraction(
            observation("upfront_payment", "Transfer biaya administrasi Rp150.000"),
            {"code": "upfront_payment", "state": "not_detected", "evidence": []},
        )
    )
    items, _ = ground_indicators(model, SUSPICIOUS_TEXT, has_image=False, sufficient=True)
    assert items[0].state == "uncertain"
