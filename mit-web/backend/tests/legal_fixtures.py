"""Fixture CC0 buatan tim; tidak memuat aturan atau sumber hukum nyata."""

from collections.abc import Sequence
from pathlib import Path

from app.services.ai.embeddings import normalize_vector
from app.services.knowledge.static_index import canonical_bytes, digest

FIXTURE_PAGES = [
    "[MOCK] Fixture sintetis CC0. Bukan dokumen hukum.\nPasal 1\n"
    "Dokumen latihan: permintaan transfer biaya sebelum wawancara perlu ditinjau.\n"
    "Pengecualian latihan: jenis pelaksana dan konteks harus diperiksa. Bukan aturan nyata.",
    "Pasal 2\nDokumen latihan: data pribadi dan OTP merupakan topik terpisah.\n"
    "Jangan memakai dokumen sintetis ini sebagai dasar hukum.",
]


class MockEmbeddings:
    """Vektor berdasar kosakata fixture, BUKAN model embedding semantik."""

    model_id = "mock-embedding-v1"

    def __init__(self, dimensions: int = 768) -> None:
        self.dimensions = dimensions
        self.query_calls = 0
        self.document_items = 0

    def vector(self, text: str) -> list[float]:
        text = text.casefold()
        values = [0.0] * self.dimensions
        values[0] = float(any(word in text for word in ("biaya", "transfer", "penempatan")))
        values[1] = float(any(word in text for word in ("data pribadi", "otp", "ktp")))
        if not any(values):
            values[2] = 1.0
        return normalize_vector(values, self.dimensions)

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        self.document_items += len(texts)
        return [self.vector(text) for text in texts]

    async def embed_query(self, text: str) -> list[float]:
        self.query_calls += 1
        values = self.vector(text)
        if values[2] == 1.0:
            values[2], values[3] = 0.0, 1.0
        return values


def pdf_bytes(pages: list[str]) -> bytes:
    from io import BytesIO

    from pypdf import PdfWriter
    from pypdf.generic import (
        DecodedStreamObject,
        DictionaryObject,
        NameObject,
    )

    writer = PdfWriter()
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    for text in pages:
        page = writer.add_blank_page(width=595, height=842)
        page[NameObject("/Resources")] = DictionaryObject(
            {NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font)})}
        )
        lines = []
        for line in text.splitlines():
            escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            lines.append(f"({escaped}) Tj T*")
        stream = DecodedStreamObject()
        stream.set_data(
            ("BT /F1 10 Tf 14 TL 36 800 Td\n" + "\n".join(lines) + "\nET").encode("ascii")
        )
        page[NameObject("/Contents")] = writer._add_object(stream)
    writer.add_metadata({"/Title": "MOCK fixture CC0 - not legal authority"})
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def create_fixture_files(root: Path) -> tuple[Path, Path]:
    root.mkdir(parents=True, exist_ok=True)
    pdf = pdf_bytes(FIXTURE_PAGES)
    (root / "synthetic-cc0.pdf").write_bytes(pdf)
    registry = [
        {
            "source_id": "mock-legal-fixture",
            "type": "regulation",
            "title": "[MOCK] Fixture sintetis CC0, bukan peraturan",
            "article": None,
            "official_url": "https://fixtures.invalid/synthetic-cc0.pdf",
            "summary": "Materi buatan untuk menguji indexing/retrieval, bukan nasihat hukum.",
            "verified_at": "2026-10-30",
            "review_after": "2027-01-31",
            "verification_status": "verified",
            "exceptions": "Hanya latihan sintetis. Tidak berlaku untuk kasus hukum nyata.",
            "indicator_codes": ["upfront_payment", "credential_request"],
        }
    ]
    documents = {
        "documents": [
            {
                "source_id": "mock-legal-fixture",
                "pdf_path": "synthetic-cc0.pdf",
                "pdf_sha256": digest(pdf),
                "document_version": "mock-cc0-v1",
                "document_date": "2026-10-30",
                "scope": "Pengujian software saja, bukan hukum Indonesia.",
                "license_note": "CC0-1.0; fixture asli yang dibuat untuk proyek ini.",
                "redistribution_allowed": True,
                "topics": ["recruitment_fees", "personal_data"],
                "required_facts": [
                    "Konteks kasus belum diperiksa; fixture tidak memiliki otoritas hukum."
                ],
                "validated_articles": [{"page": 1, "article": "Pasal 1"}],
            }
        ]
    }
    registry_path = root / "legal_sources.json"
    documents_path = root / "legal_documents.json"
    registry_path.write_bytes(canonical_bytes(registry))
    documents_path.write_bytes(canonical_bytes(documents))
    return documents_path, registry_path


if __name__ == "__main__":
    create_fixture_files(Path(__file__).parent / "fixtures")
    print("MOCK: fixture PDF CC0 tersedia di tests/fixtures; bukan sumber hukum.")
