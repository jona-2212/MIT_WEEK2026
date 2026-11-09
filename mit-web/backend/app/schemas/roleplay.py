from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.recognition import StrictModel

Language = Literal["ID", "EN"]


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
    language: Literal["ID", "EN"] = "ID"
    version: Literal["roleplay-v1"] = "roleplay-v1"
    total_questions: int = 5
    questions: list[SimulatorQuestion] = Field(default_factory=list)


class GenerateCustomScenarioRequest(StrictModel):
    user_prompt: str = Field(min_length=20, max_length=1500, repr=False)
    language: Language = "ID"


class CustomContext(StrictModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=20, max_length=500)
    template_id: Literal[
        "wfh-deposit", "telegram-task", "soe-travel", "apk-phishing", "overseas-job"
    ]


class ChatMessageHistory(StrictModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=1000, repr=False)


class RoleplayChatRequest(StrictModel):
    message: str = Field(min_length=1, max_length=1000, repr=False)
    character: Literal["jeli", "recruiter"] = "jeli"
    language: Language = "ID"
    history: list[ChatMessageHistory] = Field(default_factory=list, max_length=6, repr=False)


class AvatarReply(StrictModel):
    reply: str = Field(min_length=1, max_length=600, repr=False)
    emotion: Literal["talking", "happy", "warning", "thinking", "celebrate"] = "talking"
    key_takeaway: str = Field(default="", max_length=240)
    suggested_replies: list[str] = Field(default_factory=list, max_length=3)


class RoleplayChatResponse(AvatarReply):
    mode: Literal["live", "fallback"] = "live"


class SpeechRequest(StrictModel):
    text: str = Field(min_length=1, max_length=600, repr=False)
    lang: Literal["id", "en"] = "id"
