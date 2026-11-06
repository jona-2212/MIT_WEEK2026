from datetime import date, datetime
from typing import Literal

from pydantic import Field, HttpUrl

from app.schemas.recognition import IndicatorCode, LegalTopic, StrictModel


class KnowledgeEntry(StrictModel):
    source_id: str = Field(pattern=r"^[a-z0-9-]{1,80}$")
    type: Literal["regulation", "official_guidance"]
    title: str = Field(min_length=1)
    article: str | None
    official_url: HttpUrl | None
    summary: str
    verified_at: date | None
    review_after: date | None
    verification_status: Literal["verified", "pending_verification", "expired"]
    exceptions: str
    indicator_codes: list[IndicatorCode]


class ArticleAnchor(StrictModel):
    page: int = Field(ge=1)
    article: str = Field(pattern=r"^Pasal [0-9]+[A-Z]?$", max_length=40)


class DocumentSpec(StrictModel):
    source_id: str = Field(pattern=r"^[a-z0-9-]{1,80}$")
    pdf_path: str = Field(min_length=1, max_length=500)
    pdf_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    document_version: str = Field(min_length=1, max_length=200)
    document_date: date
    scope: str = Field(min_length=1, max_length=2000)
    license_note: str = Field(min_length=1, max_length=1000)
    redistribution_allowed: bool
    topics: list[LegalTopic] = Field(min_length=1, max_length=3)
    required_facts: list[str] = Field(max_length=10)
    validated_articles: list[ArticleAnchor] = Field(default_factory=list, max_length=200)
    include_articles: list[str] = Field(default_factory=list, max_length=200)


class DocumentManifest(StrictModel):
    documents: list[DocumentSpec] = Field(max_length=20)


class LegalSource(KnowledgeEntry):
    pdf_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    document_version: str = Field(min_length=1, max_length=200)
    document_date: date
    scope: str = Field(min_length=1, max_length=2000)
    license_note: str = Field(min_length=1, max_length=1000)
    redistribution_allowed: bool
    topics: list[LegalTopic] = Field(min_length=1, max_length=3)
    required_facts: list[str] = Field(max_length=10)
    validated_articles: list[ArticleAnchor] = Field(default_factory=list, max_length=200)
    include_articles: list[str] = Field(default_factory=list, max_length=200)


class LegalChunk(StrictModel):
    chunk_id: str = Field(pattern=r"^[a-f0-9]{64}$")
    source_id: str
    text: str = Field(min_length=1, max_length=1800, repr=False)
    text_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    page_start: int = Field(ge=1)
    page_end: int = Field(ge=1)
    article: str | None = Field(default=None, pattern=r"^Pasal [0-9]+[A-Z]?$")


class IndexManifest(StrictModel):
    format_version: Literal["legal-json-v1"] = "legal-json-v1"
    purpose: Literal["official", "test_fixture"]
    model_id: str = Field(min_length=1, max_length=100)
    dimensions: int = Field(ge=1, le=3072)
    document_task: Literal["RETRIEVAL_DOCUMENT"] = "RETRIEVAL_DOCUMENT"
    query_task: Literal["RETRIEVAL_QUERY"] = "RETRIEVAL_QUERY"
    normalization: Literal["l2"] = "l2"
    built_at: datetime
    chunk_size: int = Field(ge=200, le=1800)
    overlap: int = Field(ge=0, le=200)
    chunk_count: int = Field(ge=1, le=1000)
    registry_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    chunks_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    vectors_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    index_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    sources: list[LegalSource] = Field(min_length=1, max_length=20)
    page_counts: dict[str, int]
