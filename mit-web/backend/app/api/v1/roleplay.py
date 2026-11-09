from typing import Literal, TypeVar

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, ValidationError

from app.core.errors import AnalysisError
from app.schemas.roleplay import (
    GenerateCustomScenarioRequest,
    RoleplayChatRequest,
    RoleplayChatResponse,
    Scenario,
    SpeechRequest,
)
from app.schemas.roleplay_chat import ScenarioSummary, StartInput, TurnInput, TurnResponse
from app.services.roleplay import RoleplayService
from app.services.roleplay_chat import RecruiterRoleplayService
from app.services.roleplay_scenarios import SCENARIOS

router = APIRouter(prefix="/roleplay", tags=["Roleplay"])
T = TypeVar("T", bound=BaseModel)
MAX_BODY = 96 * 1024


async def read_json(request: Request, schema: type[T]) -> T:
    if request.headers.get("content-type", "").split(";")[0].strip() != "application/json":
        raise AnalysisError(415, "unsupported_media_type", "Kirim JSON application/json.")
    raw = bytearray()
    async for chunk in request.stream():
        raw.extend(chunk)
        if len(raw) > MAX_BODY:
            raise AnalysisError(413, "request_too_large", "Permintaan roleplay terlalu besar.")
    try:
        return schema.model_validate_json(raw)
    except ValidationError:
        raise AnalysisError(
            422, "validation_error", "Data permintaan roleplay tidak valid."
        ) from None


def recruiter_service(request: Request) -> RecruiterRoleplayService:
    result = getattr(request.app.state, "recruiter_service", None)
    if result is None:
        raise AnalysisError(503, "service_not_ready", "Layanan roleplay belum siap.")
    return result


def request_schema(schema: type[BaseModel]) -> dict:
    return {
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {"schema": schema.model_json_schema()},
            },
        }
    }


@router.get("/chat-scenarios", response_model=list[ScenarioSummary])
async def scenarios(lang: Literal["id", "en"] = "id") -> list[ScenarioSummary]:
    return [scenario.summary for scenario in SCENARIOS[lang.upper()].values()]


@router.post("/start", response_model=TurnResponse, openapi_extra=request_schema(StartInput))
async def start(request: Request) -> TurnResponse:
    data = await read_json(request, StartInput)
    return recruiter_service(request).start(data.scenario_id, data.language)


@router.post("/turn", response_model=TurnResponse, openapi_extra=request_schema(TurnInput))
async def turn(request: Request) -> TurnResponse:
    data = await read_json(request, TurnInput)
    return await recruiter_service(request).turn(data)


def practice_service(request: Request) -> RoleplayService:
    result = getattr(request.app.state, "roleplay_service", None)
    if result is None:
        raise AnalysisError(503, "service_not_ready", "Layanan roleplay belum siap.")
    return result


@router.get("/scenarios", response_model=list[Scenario])
async def practice_scenarios(request: Request, lang: str = "id") -> list[Scenario]:
    return practice_service(request).get_scenarios(lang.lower())


@router.post(
    "/custom",
    response_model=Scenario,
    openapi_extra=request_schema(GenerateCustomScenarioRequest),
)
async def custom(request: Request) -> Scenario:
    data = await read_json(request, GenerateCustomScenarioRequest)
    return await practice_service(request).generate_custom_scenario(data)


@router.post(
    "/chat", response_model=RoleplayChatResponse, openapi_extra=request_schema(RoleplayChatRequest)
)
async def chat(request: Request) -> RoleplayChatResponse:
    data = await read_json(request, RoleplayChatRequest)
    return await practice_service(request).chat_conversation(data)


@router.post(
    "/tts",
    response_class=Response,
    openapi_extra=request_schema(SpeechRequest),
    responses={200: {"content": {"audio/mpeg": {}}}, 204: {"description": "Audio unavailable"}},
)
async def tts(request: Request) -> Response:
    data = await read_json(request, SpeechRequest)
    audio = await practice_service(request).synthesize_speech(data)
    headers = {"Cache-Control": "no-store"}
    if not audio:
        return Response(status_code=204, headers=headers)
    return Response(audio, media_type="audio/mpeg", headers=headers)
