"""Tooling offline saja. Modul ini tidak diimpor server/runtime Vercel."""

import re
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from typing import Literal

from app.schemas.knowledge import (
    DocumentManifest,
    DocumentSpec,
    IndexManifest,
    LegalChunk,
    LegalSource,
)
from app.services.ai.embeddings import EmbeddingProvider, normalize_vector
from app.services.knowledge.retrieval import is_verified, load_registry
from app.services.knowledge.static_index import (
    canonical_bytes,
    digest,
    manifest_digest,
    read_bounded,
    verify_index,
)

ARTICLE = re.compile(r"(?m)^[ \t]*Pasal[ \t]+([0-9]+[A-Z]?)[ \t]*$")
MAX_PDF_BYTES = 10 * 1024 * 1024


class BuildError(ValueError):
    def __init__(self, failures: list[dict[str, str]]) -> None:
        self.failures = failures
        super().__init__("legal_build_rejected")


def extract_pdf(path: Path, checksum: str) -> list[str]:
    # pypdf hanya dependency dev/offline; tidak diperlukan pada query RAG.
    from pypdf import PdfReader

    try:
        raw = read_bounded(path, MAX_PDF_BYTES)
    except OSError:
        raise ValueError("pdf_missing") from None
    if digest(raw) != checksum:
        raise ValueError("pdf_checksum_mismatch")
    if not raw.startswith(b"%PDF-"):
        raise ValueError("pdf_invalid")
    try:
        reader = PdfReader(BytesIO(raw), strict=True)
        if reader.is_encrypted:
            raise ValueError("pdf_encrypted")
        if not 1 <= len(reader.pages) <= 100:
            raise ValueError("pdf_page_limit")
        pages = []
        for page in reader.pages:
            content = page.get_contents()
            if content is not None and len(content.get_data()) > 2 * 1024 * 1024:
                raise ValueError("pdf_content_limit")
            text = page.extract_text().replace("\r\n", "\n").strip()
            # Halaman kosong/scan harus ditinjau developer; jangan hilangkan diam-diam.
            if not text or not any(c.isalpha() for c in text):
                raise ValueError("pdf_unreadable_page")
            if len(text) > 100_000:
                raise ValueError("pdf_text_limit")
            pages.append(text)
        if sum(map(len, pages)) > 1_000_000:
            raise ValueError("pdf_text_limit")
        return pages
    except Exception as error:
        code = str(error)
        raise ValueError(code if code.startswith("pdf_") else "pdf_invalid") from None


def split_text(text: str, size: int, overlap: int) -> list[str]:
    parts = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            boundary = max(
                text.rfind("\n", start + size // 2, end), text.rfind(" ", start + size // 2, end)
            )
            if boundary > start:
                end = boundary
        part = text[start:end].strip()
        if part:
            parts.append(part)
        if end == len(text):
            break
        start = max(start + 1, end - overlap)
    return parts


def chunk_pages(
    spec: DocumentSpec, pages: list[str], size: int = 1800, overlap: int = 200
) -> list[LegalChunk]:
    if not 200 <= size <= 1800 or not 0 <= overlap <= min(200, size - 1):
        raise ValueError("legal_chunk_parameters_invalid")
    approved = {(anchor.page, anchor.article) for anchor in spec.validated_articles}
    found = {
        (page, "Pasal " + match.group(1))
        for page, text in enumerate(pages, 1)
        for match in ARTICLE.finditer(text)
    }
    if not approved.issubset(found) or len(approved) != len(spec.validated_articles):
        raise ValueError("legal_article_anchor_invalid")
    included = set(spec.include_articles)
    if not included.issubset({article for _, article in approved}) or len(included) != len(
        spec.include_articles
    ):
        raise ValueError("legal_article_selection_invalid")
    chunks = []
    active_article = None
    for page_number, text in enumerate(pages, 1):
        matches = list(ARTICLE.finditer(text))
        sections: list[tuple[str | None, str]] = []
        cursor = 0
        for match in matches:
            sections.append((active_article, text[cursor : match.start()]))
            article = "Pasal " + match.group(1)
            active_article = article if (page_number, article) in approved else None
            cursor = match.start()
        sections.append((active_article, text[cursor:]))
        for article, section in sections:
            for part in split_text(section, size, overlap):
                chunk_id = digest(
                    canonical_bytes(
                        {
                            "source": spec.source_id,
                            "pdf": spec.pdf_sha256,
                            "page": page_number,
                            "article": article,
                            "text": part,
                        }
                    )
                )
                chunks.append(
                    LegalChunk(
                        chunk_id=chunk_id,
                        source_id=spec.source_id,
                        text=part,
                        text_sha256=digest(part.encode("utf-8")),
                        page_start=page_number,
                        page_end=page_number,
                        article=article,
                    )
                )
    # Potongan identik dalam halaman yang sama tidak perlu di-embed dua kali.
    return [
        chunk
        for chunk in {c.chunk_id: c for c in chunks}.values()
        if not included or chunk.article in included
    ]


def prepare_index_inputs(
    documents_path: Path,
    registry_path: Path,
    *,
    purpose: Literal["official", "test_fixture"] = "official",
    chunk_size: int = 1800,
    overlap: int = 200,
) -> tuple[list[LegalSource], list[LegalChunk], dict[str, int], str]:
    documents = DocumentManifest.model_validate_json(read_bounded(documents_path, 2 << 20))
    if not documents.documents:
        raise ValueError("legal_documents_empty")
    if len({doc.source_id for doc in documents.documents}) != len(documents.documents):
        raise ValueError("legal_document_duplicate")
    entries, registry_hash = load_registry(registry_path)
    chunks: list[LegalChunk] = []
    sources = []
    page_counts = {}
    failures = []
    for spec in sorted(documents.documents, key=lambda doc: doc.source_id):
        try:
            entry = entries.get(spec.source_id)
            fixture = purpose == "test_fixture"
            if entry is None or not is_verified(entry, allow_test=fixture):
                raise ValueError("legal_source_unverified")
            if not spec.redistribution_allowed:
                raise ValueError("legal_redistribution_unapproved")
            if fixture and not (
                spec.source_id.startswith("mock-")
                and "CC0" in spec.license_note
                and entry.official_url
                and entry.official_url.host.endswith(".invalid")
            ):
                raise ValueError("legal_fixture_invalid")
            pages = extract_pdf(documents_path.parent / spec.pdf_path, spec.pdf_sha256)
            chunks.extend(chunk_pages(spec, pages, chunk_size, overlap))
            sources.append(
                LegalSource.model_validate(
                    {
                        **entry.model_dump(),
                        **spec.model_dump(exclude={"source_id", "pdf_path"}),
                    }
                )
            )
            page_counts[spec.source_id] = len(pages)
        except (OSError, ValueError) as error:
            code = str(error)
            failures.append(
                {
                    "source_id": spec.source_id,
                    "code": code
                    if code.startswith(("pdf_", "legal_"))
                    else "legal_document_invalid",
                }
            )
    if failures:
        # Tidak mengganti indeks sebelumnya dengan build yang tidak lengkap.
        raise BuildError(failures)
    if not 1 <= len(chunks) <= 1000:
        raise ValueError("legal_chunk_limit")
    return sources, chunks, page_counts, registry_hash


async def build_index(
    documents_path: Path,
    registry_path: Path,
    output: Path,
    embeddings: EmbeddingProvider,
    *,
    purpose: Literal["official", "test_fixture"] = "official",
    chunk_size: int = 1800,
    overlap: int = 200,
) -> dict:
    sources, chunks, page_counts, registry_hash = prepare_index_inputs(
        documents_path,
        registry_path,
        purpose=purpose,
        chunk_size=chunk_size,
        overlap=overlap,
    )
    if purpose == "official" and embeddings.model_id.startswith("mock-"):
        raise ValueError("legal_mock_embedding_forbidden")
    raw_vectors = await embeddings.embed_documents([c.text for c in chunks])
    if len(raw_vectors) != len(chunks):
        raise ValueError("legal_embedding_count_mismatch")
    vectors = [normalize_vector(v, embeddings.dimensions) for v in raw_vectors]
    chunk_bytes = canonical_bytes([c.model_dump(mode="json") for c in chunks])
    vector_bytes = canonical_bytes(vectors)
    manifest = IndexManifest(
        purpose=purpose,
        model_id=embeddings.model_id,
        dimensions=embeddings.dimensions,
        built_at=datetime.now(UTC),
        chunk_size=chunk_size,
        overlap=overlap,
        chunk_count=len(chunks),
        registry_sha256=registry_hash,
        chunks_sha256=digest(chunk_bytes),
        vectors_sha256=digest(vector_bytes),
        index_sha256="0" * 64,
        sources=sources,
        page_counts=page_counts,
    )
    manifest.index_sha256 = manifest_digest(manifest)
    try:
        previous = IndexManifest.model_validate_json(
            read_bounded(output / "manifest.json", 2 << 20)
        )
        if previous.index_sha256 == manifest.index_sha256:
            manifest.built_at = previous.built_at
    except (OSError, ValueError):
        pass
    files = {
        "chunks.json": chunk_bytes,
        "vectors.json": vector_bytes,
        "manifest.json": canonical_bytes(manifest.model_dump(mode="json")),
    }
    if (
        len(files["chunks.json"]) > 8 << 20
        or len(files["vectors.json"]) > 32 << 20
        or len(files["manifest.json"]) > 2 << 20
    ):
        raise ValueError("legal_index_too_large")
    output.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        temporary = output / (name + ".tmp")
        temporary.write_bytes(content)
        temporary.replace(output / name)
    verify_index(output, registry_path, allow_test=purpose == "test_fixture")
    return {
        "mode": "MOCK" if purpose == "test_fixture" else "LIVE_EMBEDDINGS",
        "sources": len(sources),
        "pages": sum(page_counts.values()),
        "chunks": len(chunks),
        "dimensions": embeddings.dimensions,
        "model_id": embeddings.model_id,
        "bytes": sum(map(len, files.values())),
        "index_sha256": manifest.index_sha256,
        "embedding_items": len(chunks),
        "failed_sources": [],
    }
