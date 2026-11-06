import json
from pathlib import Path

import pytest

from app.schemas.knowledge import KnowledgeEntry
from app.schemas.recognition import AIExtraction
from app.services.knowledge.retrieval import grounded_query, is_verified, load_registry
from app.services.risk.grounding import ground_indicators
from tests.factories import NORMAL_TEXT, extraction, observation


def entry(**changes) -> dict:
    result = {
        "source_id": "synthetic-official-guidance",
        "type": "official_guidance",
        "title": "Panduan fiktif khusus tes",
        "article": None,
        "official_url": "https://www.kemnaker.go.id/",
        "summary": "Fixture, bukan rujukan runtime.",
        "verified_at": "2026-10-30",
        "review_after": "2027-01-31",
        "verification_status": "verified",
        "exceptions": "Hanya fixture.",
        "indicator_codes": ["upfront_payment"],
    }
    result.update(changes)
    return result


@pytest.mark.parametrize(
    "changes",
    [
        {"verification_status": "pending_verification"},
        {"verification_status": "expired"},
        {"verified_at": None},
        {"review_after": "2000-01-01"},
        {"verified_at": "2099-01-01"},
        {"summary": ""},
        {"exceptions": ""},
        {"official_url": "https://kemnaker.go.id.evil.example/"},
        {"official_url": "http://www.kemnaker.go.id/"},
        {"official_url": "https://user:password@www.kemnaker.go.id/"},
    ],
)
def test_registry_verification_gating(changes: dict) -> None:
    assert not is_verified(KnowledgeEntry.model_validate(entry(**changes)))


def test_nullable_article_is_allowed_without_guessing() -> None:
    assert is_verified(KnowledgeEntry.model_validate(entry(type="regulation", article=None)))


@pytest.mark.parametrize("content", ["broken-json", "{}", '[{"unexpected":true}]'])
def test_invalid_registry_is_rejected(tmp_path: Path, content: str) -> None:
    path = tmp_path / "registry.json"
    path.write_text(content, encoding="utf-8")
    with pytest.raises(ValueError, match="legal_registry_invalid"):
        load_registry(path)


def test_registry_rejects_duplicate_ids(tmp_path: Path) -> None:
    path = tmp_path / "registry.json"
    path.write_text(json.dumps([entry(), entry()]), encoding="utf-8")
    with pytest.raises(ValueError):
        load_registry(path)


def test_query_uses_grounded_material_only_and_respects_negation() -> None:
    model = AIExtraction.model_validate(
        extraction(
            observation("upfront_payment", "biaya palsu yang tidak ada"),
            legal_observations=[
                {
                    "topic": "recruitment_fees",
                    "evidence": [{"source": "text", "quote": "dipungut biaya"}],
                }
            ],
        )
    )
    items, _ = ground_indicators(model, NORMAL_TEXT, has_image=False, sufficient=True)
    query, topics = grounded_query(model, items, NORMAL_TEXT, has_image=False)
    assert query == "" and topics == set()
