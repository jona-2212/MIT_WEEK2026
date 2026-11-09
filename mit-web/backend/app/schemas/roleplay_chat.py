from typing import Annotated, Literal

from pydantic import Field

from app.schemas.recognition import StrictModel
from app.schemas.roleplay import Language

Action = Literal[
    "ask_details",
    "verify_independently",
    "refuse_request",
    "agree_to_payment",
    "agree_to_share_sensitive_data",
    "end_conversation",
    "unclear",
    "off_topic",
]
Outcome = Literal["active", "verified_exit", "risky_choice", "needs_clarification", "stopped"]
Skill = Literal["process", "verification", "protection", "boundaries"]


class Interpretation(StrictModel):
    action: Action
    quote: str = Field(max_length=1000, repr=False)
    uncertain: bool = Field(strict=True)


class ActorReply(StrictModel):
    message: str = Field(min_length=1, max_length=600, repr=False)


class ChatMessage(StrictModel):
    id: str
    role: Literal["recruiter", "user"]
    text: str = Field(min_length=1, max_length=1000, repr=False)


class Decision(StrictModel):
    message_id: str
    action: Action
    quote: str = Field(max_length=1000, repr=False)


class Session(StrictModel):
    version: Literal["roleplay-v1"] = "roleplay-v1"
    scenario_id: str
    language: Language = "ID"
    session_id: str
    expires_at: int
    turn_index: int = Field(default=0, ge=0, le=8)
    stage: int = Field(default=0, ge=0, le=2)
    off_topic_count: int = Field(default=0, ge=0, le=2)
    outcome: Outcome = "active"
    messages: list[ChatMessage] = Field(max_length=17, repr=False)
    decisions: list[Decision] = Field(default_factory=list, max_length=8, repr=False)
    last_client_turn_id: str = ""


class SkillResult(StrictModel):
    code: Skill
    label: str
    status: Literal["observed", "practice", "unobserved"]


class Moment(StrictModel):
    message_id: str
    quote: str
    trigger: str
    explanation: str


class Report(StrictModel):
    outcome: Outcome
    skills: list[SkillResult]
    moments: list[Moment]
    next_step: str
    safe_reply: str


class ScenarioSummary(StrictModel):
    id: str
    title: str
    description: str
    objective: str
    language: Language = "ID"
    version: Literal["roleplay-v1"] = "roleplay-v1"


class StartInput(StrictModel):
    scenario_id: str = Field(min_length=1, max_length=50)
    language: Language = "ID"


class TurnInput(StrictModel):
    session_token: str = Field(min_length=1, max_length=80_000, repr=False)
    client_turn_id: Annotated[str, Field(pattern=r"^[a-zA-Z0-9-]{1,64}$")]
    message: str = Field(min_length=1, max_length=1000, repr=False)


class TurnResponse(StrictModel):
    roleplay_version: Literal["roleplay-v1"] = "roleplay-v1"
    mode: Literal["live", "mock"] = "live"
    scenario_id: str
    language: Language = "ID"
    session_token: str = Field(repr=False)
    expires_at: int
    turn_index: int
    max_turns: Literal[8] = 8
    outcome: Outcome
    messages: list[ChatMessage]
    hint: str
    report: Report
