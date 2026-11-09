import json
from collections.abc import Iterable
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from typing import Protocol

from pydantic import ValidationError

from app.core.config import PROJECT_ROOT
from app.schemas.knowledge import KnowledgeEntry
from app.schemas.recognition import (
    AIExtraction,
    Indicator,
    IndicatorCode,
    IndicatorState,
    LegalScreening,
    LegalTopic,
)
from app.services.risk.grounding import normalize_text, supported_quote

DEFAULT_KNOWLEDGE_PATH = PROJECT_ROOT / "data/knowledge/sources.json"
OFFICIAL_DOMAINS = ("kemnaker.go.id", "peraturan.go.id", "bpk.go.id", "dpr.go.id", "bssn.go.id")


def is_verified(entry: KnowledgeEntry, *, allow_test: bool = False) -> bool:
    today = datetime.now(UTC).date()
    if (
        entry.verification_status != "verified"
        or entry.verified_at is None
        or entry.review_after is None
        or not entry.verified_at <= today <= entry.review_after
        or not entry.summary.strip()
        or not entry.exceptions.strip()
        or entry.official_url is None
    ):
        return False
    url = entry.official_url
    host = url.host or ""
    return (
        url.scheme == "https"
        and url.username is None
        and url.password is None
        and (
            any(host == domain or host.endswith("." + domain) for domain in OFFICIAL_DOMAINS)
            or (
                allow_test
                and host.endswith(".invalid")
                and entry.source_id.startswith("mock-")
                and entry.title.startswith("[MOCK]")
            )
        )
    )


def load_registry(
    path: Path, *, expected_sha256: str | None = None
) -> tuple[dict[str, KnowledgeEntry], str]:
    try:
        with path.open("rb") as source:
            raw = source.read(2 * 1024 * 1024 + 1)
        if len(raw) > 2 * 1024 * 1024:
            raise ValueError
        data = json.loads(raw)
        if not isinstance(data, list) or len(data) > 100:
            raise ValueError
        entries = [KnowledgeEntry.model_validate(item) for item in data]
        if len({e.source_id for e in entries}) != len(entries):
            raise ValueError
    except (OSError, UnicodeError, ValueError, ValidationError):
        raise ValueError("legal_registry_invalid") from None

    canonical = raw.replace(b"\r\n", b"\n")
    canonical_hash = sha256(canonical).hexdigest()
    if expected_sha256 is not None and expected_sha256 != canonical_hash:
        # Existing bundles built on Windows may have signed the CRLF representation.
        legacy_hash = sha256(canonical.replace(b"\n", b"\r\n")).hexdigest()
        if expected_sha256 != legacy_hash:
            raise ValueError("legal_registry_mismatch")
    return {entry.source_id: entry for entry in entries}, canonical_hash


class KnowledgeRetriever(Protocol):
    """Batas adapter; migrasi storage tidak mengganti kontrak respons HTTP."""

    async def retrieve(self, query: str, topics: Iterable[LegalTopic]) -> LegalScreening: ...


TOPICS: dict[IndicatorCode, LegalTopic] = {
    IndicatorCode.UPFRONT_PAYMENT: "recruitment_fees",
    IndicatorCode.CREDENTIAL_REQUEST: "personal_data",
    IndicatorCode.PREMATURE_SENSITIVE_DATA: "personal_data",
}


def grounded_query(
    extraction: AIExtraction, indicators: list[Indicator], text: str, *, has_image: bool
) -> tuple[str, set[LegalTopic]]:
    sources = {"text": normalize_text(text)}
    if has_image:
        sources["image"] = normalize_text(extraction.image_text)
    quotes: list[str] = []
    topics: set[LegalTopic] = set()
    for indicator in indicators:
        if indicator.state == IndicatorState.DETECTED and indicator.code in TOPICS:
            topics.add(TOPICS[indicator.code])
            quotes.extend(e.quote for e in indicator.evidence)
    for observation in extraction.legal_observations:
        code = (
            IndicatorCode.UPFRONT_PAYMENT
            if observation.topic == "recruitment_fees"
            else IndicatorCode.PREMATURE_SENSITIVE_DATA
        )
        supported = [
            e.quote
            for e in observation.evidence
            if supported_quote(code, normalize_text(e.quote), sources.get(e.source, ""))
        ]
        if supported:
            topics.add(observation.topic)
            quotes.extend(supported)
    return "\n".join(dict.fromkeys(quotes))[:2000], topics


def unavailable(reason: str) -> LegalScreening:
    return LegalScreening(
        status="reference_unavailable",
        summary="Rujukan hukum belum tersedia. Hasil fraud tidak menentukan kepatuhan hukum.",
        warnings=[reason],
    )
