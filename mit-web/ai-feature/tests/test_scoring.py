import pytest

from app.schemas.recognition import AIExtraction, Evidence, Indicator
from app.services.risk.grounding import ground_indicators
from app.services.risk.scoring import risk_level_for_score, score_indicators
from tests.factories import CODES, SUSPICIOUS_TEXT, extraction, observation


def indicator(code: str, state: str = "detected", *, evidence: bool = True) -> Indicator:
    return Indicator(
        code=code,
        state=state,
        weight=1,
        reason="Dukungan uji fiktif.",
        evidence=[Evidence(source="text", quote="Kutipan pengujian fiktif")] if evidence else [],
    )


def test_rules_are_deterministic_deduplicate_and_use_server_weights() -> None:
    items = [
        indicator("upfront_payment"),
        indicator("urgency_pressure"),
        indicator("upfront_payment"),
    ]
    expected = {
        "raw_score": 55,
        "final_score": 55,
        "contributions": [
            {"code": "upfront_payment", "weight": 40},
            {"code": "urgency_pressure", "weight": 15},
        ],
    }
    assert score_indicators(items).model_dump() == expected
    assert score_indicators(list(reversed(items))).model_dump() == expected


def test_all_indicators_cap_at_100() -> None:
    score = score_indicators([indicator(code) for code in CODES])
    assert score.raw_score == 135
    assert score.final_score == 100
    assert len(score.contributions) == 6


@pytest.mark.parametrize("state", ["uncertain", "not_detected"])
def test_uncertainty_does_not_add_score(state: str) -> None:
    assert score_indicators([indicator("credential_request", state)]).final_score == 0


def test_detected_without_evidence_does_not_score() -> None:
    assert score_indicators([indicator("upfront_payment", evidence=False)]).raw_score == 0


def test_insufficient_is_null_not_zero() -> None:
    result = score_indicators([indicator("upfront_payment")], sufficient=False)
    assert result.final_score is None
    assert result.raw_score == 0
    assert result.contributions == []


@pytest.mark.parametrize(
    "score,level",
    [(0, "low"), (24, "low"), (25, "medium"), (49, "medium"), (50, "high"), (100, "high")],
)
def test_thresholds(score: int, level: str) -> None:
    assert risk_level_for_score(score) == level


@pytest.mark.parametrize("score", [-1, 101])
def test_out_of_range_score_is_rejected(score: int) -> None:
    with pytest.raises(ValueError):
        risk_level_for_score(score)


def test_grounding_rejects_fabricated_quotes() -> None:
    model = AIExtraction.model_validate(
        extraction(observation("upfront_payment", "bayar tiket pesawat palsu"))
    )
    indicators, rejected = ground_indicators(
        model, SUSPICIOUS_TEXT, has_image=False, sufficient=True
    )
    assert rejected is True
    assert indicators[0].state == "uncertain"
    assert indicators[0].evidence == []
    assert score_indicators(indicators).raw_score == 0


def test_grounding_combines_modalities_and_normalizes_whitespace() -> None:
    model = AIExtraction.model_validate(
        extraction(
            observation("upfront_payment", "TRANSFER biaya administrasi Rp150.000"),
            observation("upfront_payment", "transfer biaya administrasi Rp150.000", "image"),
            image_text=SUSPICIOUS_TEXT,
        )
    )
    indicators, rejected = ground_indicators(
        model, SUSPICIOUS_TEXT, has_image=True, sufficient=True
    )
    assert rejected is False
    assert len(indicators[0].evidence) == 2
    assert score_indicators(indicators).final_score == 40


@pytest.mark.parametrize(
    "quote,source", [("OTP", "text"), ("transfer biaya administrasi", "image")]
)
def test_single_word_or_absent_source_is_not_grounded(quote: str, source: str) -> None:
    model = AIExtraction.model_validate(
        extraction(observation("upfront_payment", quote, source), image_text=SUSPICIOUS_TEXT)
    )
    indicators, _ = ground_indicators(model, SUSPICIOUS_TEXT, has_image=False, sufficient=True)
    assert score_indicators(indicators).raw_score == 0


@pytest.mark.parametrize(
    "code,source,quote",
    [
        (
            "upfront_payment",
            "Proses tidak dipungut biaya administrasi.",
            "dipungut biaya administrasi",
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
def test_quote_cannot_cut_out_explicit_negation(code: str, source: str, quote: str) -> None:
    model = AIExtraction.model_validate(extraction(observation(code, quote)))
    indicators, rejected = ground_indicators(model, source, has_image=False, sufficient=True)
    assert rejected is True
    assert score_indicators(indicators).final_score == 0


def test_urgency_word_jangan_does_not_negate_payment_request() -> None:
    source = "Jangan tunda, transfer biaya administrasi sebelum wawancara sekarang juga."
    model = AIExtraction.model_validate(
        extraction(observation("upfront_payment", "transfer biaya administrasi"))
    )
    indicators, _ = ground_indicators(model, source, has_image=False, sufficient=True)
    assert score_indicators(indicators).final_score == 40
