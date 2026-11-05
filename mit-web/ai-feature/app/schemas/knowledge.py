from datetime import date
from typing import Literal

from pydantic import Field, HttpUrl

from app.schemas.recognition import IndicatorCode, StrictModel


class KnowledgeEntry(StrictModel):
    source_id: str = Field(pattern=r"^[a-z0-9-]{1,80}$")
    type: Literal["regulation", "official_guidance"]
    title: str = Field(min_length=1)
    article: str | None
    official_url: HttpUrl | None
    summary: str
    verified_at: date | None
    review_after: date | None
    verification_status: Literal["verified", "pending_verification"]
    exceptions: str
    indicator_codes: list[IndicatorCode]
