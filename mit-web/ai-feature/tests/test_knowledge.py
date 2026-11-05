import json
from datetime import date, timedelta
from pathlib import Path

import pytest

from app.services.knowledge.retrieval import KnowledgeRetriever
from app.services.risk.scoring import score_indicators
from tests.test_scoring import indicator


def entry(**changes) -> dict:
    today = date(2026, 10, 31)
    result = {
        "source_id": "synthetic-official-guidance",
        "type": "official_guidance",
        "title": "Panduan fiktif untuk uji loader",
        "article": None,
        "official_url": "https://www.kemnaker.go.id/",
        "summary": "Ringkasan sintetis khusus tes, bukan rujukan runtime.",
        "verified_at": (today - timedelta(days=1)).isoformat(),
        "review_after": (today + timedelta(days=30)).isoformat(),
        "verification_status": "verified",
        "exceptions": "Hanya fixture pengujian.",
        "indicator_codes": ["upfront_payment"],
    }
    result.update(changes)
    return result


def loader(tmp_path: Path, entries: list[dict]) -> KnowledgeRetriever:
    path = tmp_path / "sources.json"
    path.write_text(json.dumps(entries), encoding="utf-8")
    return KnowledgeRetriever(path)


def test_retrieve_only_matching_verified_reference_and_deduplicate(tmp_path: Path) -> None:
    retriever = loader(tmp_path, [entry(), entry()])
    result = retriever.retrieve(["upfront_payment", "upfront_payment"])
    assert len(result) == 1
    assert result[0].source_id == "synthetic-official-guidance"
    assert retriever.retrieve(["credential_request"]) == []


@pytest.mark.parametrize(
    "changes",
    [
        {"verification_status": "pending_verification"},
        {"verified_at": None},
        {"review_after": "2000-01-01"},
        {"verified_at": "2099-01-01"},
        {"summary": ""},
        {"exceptions": ""},
        {"official_url": "https://kemnaker.go.id.evil.example/"},
        {"official_url": "http://www.kemnaker.go.id/"},
        {"official_url": "https://user:password@www.kemnaker.go.id/"},
        {"type": "regulation", "article": None},
    ],
)
def test_retrieval_excludes_unverified_incomplete_or_unsafe_sources(
    tmp_path: Path, changes: dict
) -> None:
    assert loader(tmp_path, [entry(**changes)]).retrieve(["upfront_payment"]) == []


@pytest.mark.parametrize("content", ["broken-json", "{}", '[{"unexpected": true}]'])
def test_invalid_knowledge_is_safe_fallback(tmp_path: Path, content: str) -> None:
    path = tmp_path / "sources.json"
    path.write_text(content, encoding="utf-8")
    assert KnowledgeRetriever(path).retrieve(["upfront_payment"]) == []


def test_missing_knowledge_does_not_change_scoring(tmp_path: Path) -> None:
    indicators = [indicator("upfront_payment")]
    before = score_indicators(indicators)
    assert KnowledgeRetriever(tmp_path / "absent.json").retrieve(["upfront_payment"]) == []
    assert score_indicators(indicators) == before
    assert before.final_score == 40
