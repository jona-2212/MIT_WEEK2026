"""Chroma lokal KHUSUS developer/offline. Tidak diimpor oleh application factory.

Semua embedding harus sudah tersedia. embedding_function=None mencegah download
model atau panggilan provider tersembunyi ketika menyimpan/mengambil data.
"""

from datetime import UTC, datetime
from pathlib import Path
from tempfile import TemporaryDirectory

from app.core.config import PROJECT_ROOT
from app.schemas.knowledge import IndexManifest, LegalChunk
from app.services.ai.embeddings import normalize_vector
from app.services.knowledge.static_index import (
    canonical_bytes,
    digest,
    manifest_digest,
    verify_index,
)


def local_client(path: Path):
    import chromadb
    from chromadb.config import Settings

    path = path.resolve()
    if path.is_relative_to((PROJECT_ROOT / "data/legal_index").resolve()):
        raise ValueError("chroma_path_must_be_separate_from_runtime_bundle")
    return chromadb.PersistentClient(
        path=str(path),
        settings=Settings(
            chroma_api_impl="chromadb.api.segment.SegmentAPI",
            anonymized_telemetry=False,
            allow_reset=False,
        ),
    )


def initialize_chroma(
    path: Path, *, model_id: str = "gemini-embedding-001", dimensions: int = 768
) -> dict:
    client = local_client(path)
    metadata = {
        "hnsw:space": "cosine",
        "purpose": "official",
        "model_id": model_id,
        "dimensions": dimensions,
        "status": "awaiting_embeddings",
    }
    collection = client.get_or_create_collection(
        name="jeli-legal-official",
        embedding_function=None,
        metadata=metadata,
    )
    actual = collection.metadata or {}
    if any(actual.get(key) != metadata[key] for key in ("purpose", "model_id", "dimensions")):
        raise ValueError("chroma_collection_model_mismatch")
    return {
        "status": "ready",
        "collection": collection.name,
        "records": collection.count(),
        "model_id": model_id,
        "dimensions": dimensions,
        "embedding_api_calls": 0,
    }


def sync_index_to_chroma(
    index: Path,
    registry: Path,
    database: Path,
    *,
    allow_test: bool = False,
    collection_name: str | None = None,
) -> dict:
    manifest, chunks, vectors = verify_index(index, registry, allow_test=allow_test)
    prefix = "jeli-legal-mock" if manifest.purpose == "test_fixture" else "jeli-legal"
    name = collection_name or f"{prefix}-{manifest.index_sha256[:16]}"
    if manifest.purpose == "test_fixture" and not name.startswith("jeli-legal-mock"):
        raise ValueError("chroma_fixture_collection_forbidden")
    client = local_client(database)
    metadata = {
        "hnsw:space": "cosine",
        "purpose": manifest.purpose,
        "model_id": manifest.model_id,
        "dimensions": manifest.dimensions,
        "index_sha256": manifest.index_sha256,
        "status": "indexed",
        "manifest_json": canonical_bytes(manifest.model_dump(mode="json")).decode(),
    }
    collection = client.get_or_create_collection(
        name=name,
        embedding_function=None,
        metadata=metadata,
    )
    actual = collection.metadata or {}
    for key in ("purpose", "model_id", "dimensions"):
        if actual.get(key) != metadata[key]:
            raise ValueError("chroma_collection_model_mismatch")
    if collection.count() and actual.get("index_sha256") != manifest.index_sha256:
        raise ValueError("chroma_collection_index_mismatch")
    if not collection.count():
        collection.modify(metadata=metadata)
    sources = {s.source_id: s for s in manifest.sources}
    for start in range(0, len(chunks), 100):
        batch = chunks[start : start + 100]
        collection.upsert(
            ids=[c.chunk_id for c in batch],
            documents=[c.text for c in batch],
            embeddings=vectors[start : start + 100],
            metadatas=[
                {
                    "source_id": c.source_id,
                    "page_start": c.page_start,
                    "page_end": c.page_end,
                    "article": c.article or "",
                    "purpose": manifest.purpose,
                    "verification_status": "verified",
                    "pdf_sha256": sources[c.source_id].pdf_sha256,
                    "official_url": str(sources[c.source_id].official_url),
                    "review_after": sources[c.source_id].review_after.isoformat(),
                    "chunk_order": start + offset,
                    "index_sha256": manifest.index_sha256,
                    "chunk_json": canonical_bytes(c.model_dump(mode="json")).decode(),
                }
                for offset, c in enumerate(batch)
            ],
        )
    if collection.count() != len(chunks):
        raise ValueError("chroma_collection_count_mismatch")
    return {
        "status": "stored",
        "purpose": manifest.purpose,
        "collection": name,
        "records": collection.count(),
        "dimensions": manifest.dimensions,
        "index_sha256": manifest.index_sha256,
        "embedding_api_calls": 0,
    }


def export_chroma_index(
    database: Path,
    collection_name: str,
    output: Path,
    registry: Path,
    *,
    allow_test: bool = False,
) -> dict:
    collection = local_client(database).get_collection(collection_name, embedding_function=None)
    metadata = collection.metadata or {}
    try:
        manifest = IndexManifest.model_validate_json(metadata["manifest_json"])
    except (KeyError, ValueError):
        raise ValueError("chroma_collection_not_indexed") from None
    if manifest.purpose == "test_fixture" and not allow_test:
        raise ValueError("legal_test_index_forbidden")
    records = collection.get(include=["documents", "embeddings", "metadatas"])
    if len(records["ids"]) != manifest.chunk_count or records["embeddings"] is None:
        raise ValueError("chroma_collection_count_mismatch")
    rows = sorted(
        zip(
            records["ids"],
            records["documents"],
            records["embeddings"],
            records["metadatas"],
            strict=True,
        ),
        key=lambda row: row[3]["chunk_order"],
    )
    chunks, vectors = [], []
    for identifier, text, vector, record in rows:
        chunk = LegalChunk.model_validate_json(record["chunk_json"])
        if (
            identifier != chunk.chunk_id
            or text != chunk.text
            or record["index_sha256"] != manifest.index_sha256
        ):
            raise ValueError("chroma_record_mismatch")
        chunks.append(chunk)
        values = vector.tolist() if hasattr(vector, "tolist") else list(vector)
        vectors.append(normalize_vector(values, manifest.dimensions))
    chunk_bytes = canonical_bytes([c.model_dump(mode="json") for c in chunks])
    vector_bytes = canonical_bytes(vectors)
    manifest.chunks_sha256, manifest.vectors_sha256 = digest(chunk_bytes), digest(vector_bytes)
    manifest.built_at = datetime.now(UTC)
    manifest.index_sha256 = manifest_digest(manifest)
    try:
        previous = IndexManifest.model_validate_json((output / "manifest.json").read_bytes())
        if previous.index_sha256 == manifest.index_sha256:
            manifest.built_at = previous.built_at
    except (OSError, ValueError):
        pass
    files = {
        "chunks.json": chunk_bytes,
        "vectors.json": vector_bytes,
        "manifest.json": canonical_bytes(manifest.model_dump(mode="json")),
    }
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="jeli-export-", dir=output.parent) as temporary:
        staging = Path(temporary).resolve()
        # Cleanup direktori sementara hanya boleh berada pada parent output yang eksplisit.
        if not staging.is_relative_to(output.parent):
            raise ValueError("chroma_export_path_invalid")
        for name, content in files.items():
            (staging / name).write_bytes(content)
        verify_index(staging, registry, allow_test=allow_test)
        output.mkdir(parents=True, exist_ok=True)
        for name in files:
            (staging / name).replace(output / name)
    return {
        "status": "exported_verified",
        "purpose": manifest.purpose,
        "collection": collection_name,
        "chunks": len(chunks),
        "index_sha256": manifest.index_sha256,
        "embedding_api_calls": 0,
    }
