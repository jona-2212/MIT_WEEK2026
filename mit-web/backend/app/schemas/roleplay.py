from typing import Literal
from pydantic import BaseModel, Field

Outcome = Literal["active", "verified_exit", "risky_choice", "needs_clarification", "stopped"]
SkillStatus = Literal["observed", "practice", "unobserved"]


class QuestionOption(BaseModel):
    id: str  # "A", "B", "C"
    label: str  # "Opsi A", "Opsi B"
    text: str
    is_correct: bool  # True if safe/correct, False if trap/risky
    feedback_label: str  # "Jawaban Tepat & Aman" atau "Jawaban Salah / Terjebak"
    explanation: str  # Penjelasan mendalam kenapa pilihan ini benar/salah


class SimulatorQuestion(BaseModel):
    question_number: int  # 1 to 7
    title: str  # e.g. "Tahap 1: Pancingan Gaji & Tawaran Fantastis"
    recruiter_message: str  # Chat message from fake recruiter
    challenge_text: str  # Pertanyaan instruksi untuk user
    options: list[QuestionOption] = Field(default_factory=list)
    good_answer_summary: str  # Deskripsi mengenai jawaban yang baik
    educational_takeaway: str  # Regulasi / tips kunci pencegahan


class Scenario(BaseModel):
    id: str
    title: str
    description: str
    objective: str
    language: Literal["ID"] = "ID"
    version: Literal["roleplay-v1"] = "roleplay-v1"
    total_questions: int = 5
    questions: list[SimulatorQuestion] = Field(default_factory=list)


class SkillEvaluation(BaseModel):
    code: str
    label: str
    status: SkillStatus


class Moment(BaseModel):
    message_id: str
    quote: str
    trigger: str
    explanation: str


class Report(BaseModel):
    outcome: Outcome
    skills: list[SkillEvaluation] = Field(default_factory=list)
    moments: list[Moment] = Field(default_factory=list)
    next_step: str = ""
    safe_reply: str = ""


class MessageItem(BaseModel):
    id: str
    role: Literal["recruiter", "user"]
    text: str


class RoleplaySession(BaseModel):
    roleplay_version: Literal["roleplay-v1"] = "roleplay-v1"
    mode: Literal["live", "mock"] = "live"
    scenario_id: str
    session_token: str
    expires_at: int
    turn_index: int
    max_turns: int = 7
    outcome: Outcome
    messages: list[MessageItem]
    hint: str
    report: Report


class StartRoleplayRequest(BaseModel):
    scenario_id: str


class TurnRoleplayRequest(BaseModel):
    session_token: str
    client_turn_id: str | None = None
    message: str


class GenerateCustomScenarioRequest(BaseModel):
    user_prompt: str
