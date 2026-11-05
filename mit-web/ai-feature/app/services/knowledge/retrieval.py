import json
import logging
from collections.abc import Iterable
from datetime import UTC, datetime
from pathlib import Path

from pydantic import ValidationError

from app.core.config import PROJECT_ROOT
from app.schemas.knowledge import KnowledgeEntry
from app.schemas.recognition import IndicatorCode, LegalContext

logger = logging.getLogger("job_scam_guardian.knowledge")
DEFAULT_KNOWLEDGE_PATH = PROJECT_ROOT / "data/knowledge/sources.json"
OFFICIAL_DOMAINS = ("kemnaker.go.id", "peraturan.go.id", "bpk.go.id", "dpr.go.id", "bssn.go.id")


def is_verified(entry: KnowledgeEntry) -> bool:
    today = datetime.now(UTC).date()
    if (
        entry.verification_status != "verified"
        or entry.verified_at is None
        or entry.review_after is None
        or not entry.verified_at <= today <= entry.review_after
        or not entry.summary.strip()
        or not entry.exceptions.strip()
        or entry.official_url is None
        or (entry.type == "regulation" and not entry.article)
    ):
        return False
    url = entry.official_url
    host = url.host or ""
    return (
        url.scheme == "https"
        and url.username is None
        and url.password is None
        and any(host == domain or host.endswith("." + domain) for domain in OFFICIAL_DOMAINS)
    )


class KnowledgeRetriever:
    def __init__(self, path: Path = DEFAULT_KNOWLEDGE_PATH) -> None:
        self.entries: list[KnowledgeEntry] = []
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(data, list):
                raise ValueError("invalid_container")
        except (OSError, UnicodeError, ValueError):
            logger.warning("knowledge_unavailable", extra={"component": "knowledge"})
            return
        seen = set()
        for item in data:
            try:
                entry = KnowledgeEntry.model_validate(item)
            except ValidationError:
                logger.warning("knowledge_entry_rejected", extra={"component": "knowledge"})
                continue
            if entry.source_id not in seen and is_verified(entry):
                self.entries.append(entry)
                seen.add(entry.source_id)

    def retrieve(self, codes: Iterable[IndicatorCode]) -> list[LegalContext]:
        codes = set(codes)
        return [
            LegalContext(
                source_id=entry.source_id,
                type=entry.type,
                title=entry.title,
                article=entry.article,
                official_url=str(entry.official_url),
                summary=entry.summary,
                verified_at=entry.verified_at.isoformat(),
                exceptions=entry.exceptions,
            )
            for entry in self.entries
            if is_verified(entry) and codes.intersection(entry.indicator_codes)
        ]
