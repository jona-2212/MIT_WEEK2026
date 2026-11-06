from app.core.config import PROJECT_ROOT
from app.services.knowledge.indexing import prepare_index_inputs
from app.services.knowledge.static_index import digest


def test_owner_pilot_manifest_selects_only_the_reviewed_article() -> None:
    # PDF disediakan owner dan diabaikan Git; CI tanpa PDF menguji jalur yang sama lewat fixture.
    pdf = PROJECT_ROOT / "data/knowledge/pdf/2024pmnaker018.pdf"
    if not pdf.exists():
        import pytest

        pytest.skip("PDF pilot owner tidak dibundel pada checkout ini.")
    sources, chunks, page_counts, _ = prepare_index_inputs(
        PROJECT_ROOT / "data/knowledge/legal_documents.json",
        PROJECT_ROOT / "data/knowledge/sources.json",
    )
    assert len(sources) == len(chunks) == 1
    assert page_counts == {"permenaker-18-2024-placement-fees": 74}
    assert chunks[0].page_start == chunks[0].page_end == 7 and chunks[0].article == "Pasal 11"
    assert "PPTKS" in chunks[0].text and "dikecualikan" in chunks[0].text
    assert sources[0].pdf_sha256 == digest(pdf.read_bytes())
