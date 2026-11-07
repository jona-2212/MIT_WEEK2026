"""Loader/verifier dan pencarian cosine atas bundle JSON. Tidak memiliki jalur write."""

import json
import math
from collections.abc import Iterable
from hashlib import sha256
from pathlib import Path

from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.knowledge import IndexManifest, KnowledgeEntry, LegalChunk
from app.schemas.recognition import LegalReference, LegalScreening, LegalTopic
from app.services.ai.embeddings import EmbeddingError, EmbeddingProvider, normalize_vector
from app.services.knowledge.retrieval import is_verified, load_registry, unavailable


def canonical_bytes(value: object) -> bytes:
    return (
        json.dumps(
            value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False
        )
        + "\n"
    ).encode("utf-8")


def digest(value: bytes) -> str:
    return sha256(value).hexdigest()


def manifest_digest(manifest: IndexManifest) -> str:
    # Waktu build tidak memengaruhi identitas konten.
    return digest(
        canonical_bytes(manifest.model_dump(mode="json", exclude={"built_at", "index_sha256"}))
    )


def read_bounded(path: Path, limit: int) -> bytes:
    with path.open("rb") as source:
        value = source.read(limit + 1)
    if len(value) > limit:
        raise ValueError("legal_index_too_large")
    return value


def verify_index(
    path: Path, registry_path: Path, *, allow_test: bool = False
) -> tuple[IndexManifest, list[LegalChunk], list[list[float]]]:
    try:
        manifest = IndexManifest.model_validate_json(read_bounded(path / "manifest.json", 2 << 20))
        if manifest.purpose == "test_fixture" and not allow_test:
            raise ValueError("legal_test_index_forbidden")
        if manifest.overlap >= manifest.chunk_size or manifest.built_at.tzinfo is None:
            raise ValueError("legal_index_invalid")
        if manifest.index_sha256 != manifest_digest(manifest):
            raise ValueError("legal_manifest_checksum_mismatch")
        entries, registry_hash = load_registry(registry_path)
        if registry_hash != manifest.registry_sha256:
            raise ValueError("legal_registry_mismatch")
        chunks_raw = read_bounded(path / "chunks.json", 8 << 20)
        vectors_raw = read_bounded(path / "vectors.json", 32 << 20)
        if (
            digest(chunks_raw) != manifest.chunks_sha256
            or digest(vectors_raw) != manifest.vectors_sha256
        ):
            raise ValueError("legal_index_checksum_mismatch")
        chunk_data = json.loads(chunks_raw)
        vectors = json.loads(vectors_raw)
        if not isinstance(chunk_data, list) or not isinstance(vectors, list):
            raise ValueError("legal_index_invalid")
        chunks = [LegalChunk.model_validate(item) for item in chunk_data]
        if len(chunks) != manifest.chunk_count or len(vectors) != len(chunks):
            raise ValueError("legal_index_count_mismatch")
        sources = {source.source_id: source for source in manifest.sources}
        if len(sources) != len(manifest.sources) or set(manifest.page_counts) != set(sources):
            raise ValueError("legal_source_mismatch")
        fixture = manifest.purpose == "test_fixture"
        for source in sources.values():
            registry = entries.get(source.source_id)
            if (
                registry is None
                or not is_verified(source, allow_test=fixture)
                or not is_verified(registry, allow_test=fixture)
                or not source.redistribution_allowed
                or source.model_dump(include=set(KnowledgeEntry.model_fields))
                != registry.model_dump()
                or not 1 <= manifest.page_counts[source.source_id] <= 100
                or any(
                    a.page > manifest.page_counts[source.source_id]
                    for a in source.validated_articles
                )
            ):
                raise ValueError("legal_source_unverified")
            if fixture and not (
                source.source_id.startswith("mock-") and "CC0" in source.license_note
            ):
                raise ValueError("legal_fixture_invalid")
            if not set(source.include_articles).issubset(
                {a.article for a in source.validated_articles}
            ):
                raise ValueError("legal_article_selection_invalid")
        if len({chunk.chunk_id for chunk in chunks}) != len(chunks):
            raise ValueError("legal_chunk_duplicate")
        for chunk, vector in zip(chunks, vectors, strict=True):
            if (
                chunk.source_id not in sources
                or not 1
                <= chunk.page_start
                <= chunk.page_end
                <= manifest.page_counts[chunk.source_id]
                or chunk.text_sha256 != digest(chunk.text.encode("utf-8"))
                or len(chunk.text) > manifest.chunk_size
                or chunk.page_end != chunk.page_start
            ):
                raise ValueError("legal_chunk_invalid")
            expected_id = digest(
                canonical_bytes(
                    {
                        "source": chunk.source_id,
                        "pdf": sources[chunk.source_id].pdf_sha256,
                        "page": chunk.page_start,
                        "article": chunk.article,
                        "text": chunk.text,
                    }
                )
            )
            if chunk.chunk_id != expected_id:
                raise ValueError("legal_chunk_identity_mismatch")
            if chunk.article and not any(
                a.article == chunk.article and a.page <= chunk.page_start
                for a in sources[chunk.source_id].validated_articles
            ):
                raise ValueError("legal_article_unverified")
            if (
                sources[chunk.source_id].include_articles
                and chunk.article not in sources[chunk.source_id].include_articles
            ):
                raise ValueError("legal_article_outside_selection")
            normalize_vector(vector, manifest.dimensions)
            if not math.isclose(math.hypot(*vector), 1.0, abs_tol=1e-6):
                raise ValueError("legal_vector_not_normalized")
        if set(sources) != {c.source_id for c in chunks}:
            raise ValueError("legal_source_without_chunks")
        return manifest, chunks, vectors
    except FileNotFoundError:
        raise ValueError("legal_index_missing") from None
    except (OSError, UnicodeError, ValidationError, TypeError, KeyError, OverflowError):
        raise ValueError("legal_index_invalid") from None
    except ValueError as error:
        code = str(error)
        raise ValueError(code if code.startswith("legal_") else "legal_index_invalid") from None


class StaticKnowledgeRetriever:
    def __init__(self, settings: Settings, embeddings: EmbeddingProvider) -> None:
        self.settings = settings
        self.embeddings = embeddings
        self.error: str | None = None
        self.manifest: IndexManifest | None = None
        self.chunks: list[LegalChunk] = []
        self.vectors: list[list[float]] = []
        try:
            self.manifest, self.chunks, self.vectors = verify_index(
                settings.legal_index_path,
                settings.legal_registry_path,
                allow_test=settings.app_env == "test",
            )
            if (
                self.manifest.model_id != embeddings.model_id
                or self.manifest.dimensions != embeddings.dimensions
            ):
                raise ValueError("legal_embedding_model_mismatch")
        except ValueError as error:
            self.error = str(error)

    async def retrieve(self, query: str, topics: Iterable[LegalTopic]) -> LegalScreening:
        if self.error or self.manifest is None:
            return unavailable(self.error or "legal_index_missing")
        if not query or not (topics := set(topics)):
            return LegalScreening(
                status="no_relevant_reference",
                summary="Tidak ada topik hukum berbukti untuk dicocokkan dengan korpus.",
            )
        sources = {s.source_id: s for s in self.manifest.sources}
        active = {
            key
            for key, source in sources.items()
            if is_verified(source, allow_test=self.manifest.purpose == "test_fixture")
        }
        if not active:
            return unavailable("legal_sources_expired")
        if not any(topics.intersection(sources[key].topics) for key in active):
            return LegalScreening(
                status="no_relevant_reference", summary="Topik belum dicakup oleh sumber aktif."
            )
        if (
            self.embeddings.model_id != self.manifest.model_id
            or self.embeddings.dimensions != self.manifest.dimensions
        ):
            return unavailable("legal_embedding_model_mismatch")
        try:
            query_vector = normalize_vector(
                await self.embeddings.embed_query(query), self.manifest.dimensions
            )
        except EmbeddingError as error:
            safe_codes = {
                "embedding_not_configured",
                "embedding_timeout",
                "embedding_rate_limited",
                "embedding_auth_error",
                "embedding_unavailable",
                "embedding_invalid_response",
                "embedding_dimension_mismatch",
                "embedding_invalid_vector",
            }
            return unavailable(str(error) if str(error) in safe_codes else "legal_embedding_failed")
        except TimeoutError:
            return unavailable("embedding_timeout")
        ranked = []
        for chunk, vector in zip(self.chunks, self.vectors, strict=True):
            source = sources[chunk.source_id]
            if chunk.source_id not in active or not topics.intersection(source.topics):
                continue
            similarity = math.fsum(a * b for a, b in zip(query_vector, vector, strict=True))
            ranked.append((similarity, chunk))
        ranked.sort(key=lambda item: (-item[0], item[1].chunk_id))
        candidates = [item for item in ranked if item[0] >= self.settings.legal_min_similarity]
        topic_match_only = False
        if not candidates and len(ranked) == 1:
            _, chunk = ranked[0]
            if chunk.article is not None and sources[chunk.source_id].type == "regulation":
                candidates = ranked
                topic_match_only = True
        references: list[LegalReference] = []
        missing: list[str] = []
        seen: set[tuple[str, str]] = set()
        for _, chunk in candidates:
            key = (chunk.source_id, chunk.text_sha256)
            if key in seen:
                continue
            seen.add(key)
            source = sources[chunk.source_id]
            references.append(
                LegalReference(
                    source_id=source.source_id,
                    source_kind=self.manifest.purpose,
                    chunk_id=chunk.chunk_id,
                    type=source.type,
                    title=source.title,
                    article=chunk.article,
                    official_url=str(source.official_url),
                    excerpt=chunk.text,
                    page_start=chunk.page_start,
                    page_end=chunk.page_end,
                    document_version=source.document_version,
                    verified_at=source.verified_at,
                    review_after=source.review_after,
                    pdf_sha256=source.pdf_sha256,
                    index_sha256=self.manifest.index_sha256,
                    scope=source.scope,
                    exceptions=source.exceptions,
                )
            )
            missing.extend(source.required_facts)
            # MVP tidak memutus fakta yurisdiksi/pengecualian hukum dari teks model.
            if source.type == "regulation":
                missing.append(
                    "Verifikasi jenis perekrut, cakupan aturan, dan pengecualian yang berlaku."
                )
            if len(references) >= self.settings.legal_top_k:
                break
        if not references:
            return LegalScreening(
                status="no_relevant_reference",
                summary="Indeks saat ini belum menemukan rujukan yang cukup cocok dengan tawaran.",
                warnings=["experimental_relevance_threshold"],
            )
        return LegalScreening(
            status="needs_more_context" if missing else "potential_issue",
            summary=(
                "Rujukan awal ditemukan berdasarkan topik. Periksa jenis perekrut, "
                "cakupan aturan, dan pengecualian sebelum menerapkannya pada kasus ini."
                if topic_match_only
                else "Rujukan relevan untuk ditinjau. Periksa cakupan aturan dan pengecualiannya."
            ),
            references=references,
            missing_facts=list(dict.fromkeys(missing)),
            warnings=["experimental_relevance_threshold"]
            + (["topic_match_only"] if topic_match_only else [])
            + (
                ["MOCK_FIXTURE_NOT_LEGAL_AUTHORITY"]
                if self.manifest.purpose == "test_fixture"
                else []
            ),
        )
