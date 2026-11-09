from fastapi import APIRouter, Request, Response

from app.schemas.roleplay import (
    GenerateCustomScenarioRequest,
    RoleplayChatRequest,
    RoleplayChatResponse,
    RoleplaySession,
    Scenario,
    StartRoleplayRequest,
    TurnRoleplayRequest,
)

router = APIRouter(prefix="/roleplay", tags=["Roleplay"])


@router.get(
    "/scenarios",
    response_model=list[Scenario],
    summary="Daftar skenario latihan roleplay simulasi scam",
)
async def list_scenarios(request: Request, lang: str = "id") -> list[Scenario]:
    service = getattr(request.app.state, "roleplay_service", None)
    if not service:
        from app.services.roleplay import RoleplayService

        service = RoleplayService(request.app.state.settings)
        request.app.state.roleplay_service = service
    return service.get_scenarios(lang=lang)


@router.post(
    "/start",
    response_model=RoleplaySession,
    summary="Mulai sesi simulasi roleplay baru",
)
async def start_roleplay(
    request: Request, body: StartRoleplayRequest
) -> RoleplaySession:
    service = getattr(request.app.state, "roleplay_service", None)
    if not service:
        from app.services.roleplay import RoleplayService

        service = RoleplayService(request.app.state.settings)
        request.app.state.roleplay_service = service
    return service.create_session(body.scenario_id)


@router.post(
    "/turn",
    response_model=RoleplaySession,
    summary="Kirim balasan dan lanjutkan putaran roleplay simulasi",
)
async def turn_roleplay(
    request: Request, body: TurnRoleplayRequest
) -> RoleplaySession:
    service = getattr(request.app.state, "roleplay_service", None)
    if not service:
        from app.services.roleplay import RoleplayService

        service = RoleplayService(request.app.state.settings)
        request.app.state.roleplay_service = service
    return await service.process_turn(
        body.session_token, body.client_turn_id, body.message
    )


@router.post(
    "/custom",
    response_model=Scenario,
    summary="Buat skenario simulasi roleplay kustom berdasarkan pertanyaan/kasus pengguna",
)
async def create_custom_scenario(
    request: Request, body: GenerateCustomScenarioRequest
) -> Scenario:
    service = getattr(request.app.state, "roleplay_service", None)
    if not service:
        from app.services.roleplay import RoleplayService

        service = RoleplayService(request.app.state.settings)
        request.app.state.roleplay_service = service
    return await service.generate_custom_scenario(body.user_prompt)


@router.post(
    "/chat",
    response_model=RoleplayChatResponse,
    summary="Percakapan AI live (suara/teks) dengan avatar Jeli & roleplay perekrut fiktif",
)
async def chat_conversation(
    request: Request, body: RoleplayChatRequest
) -> RoleplayChatResponse:
    service = getattr(request.app.state, "roleplay_service", None)
    if not service:
        from app.services.roleplay import RoleplayService

        service = RoleplayService(request.app.state.settings)
        request.app.state.roleplay_service = service
    return await service.chat_conversation(body)


@router.get(
    "/tts",
    summary="Audio streaming Text-to-Speech untuk balasan suara Jeli",
)
async def tts_stream(
    request: Request,
    text: str,
    lang: str = "id",
) -> Response:
    service = getattr(request.app.state, "roleplay_service", None)
    if not service:
        from app.services.roleplay import RoleplayService

        service = RoleplayService(request.app.state.settings)
        request.app.state.roleplay_service = service
    audio_bytes = await service.synthesize_speech(text, lang)
    if not audio_bytes:
        return Response(status_code=204)
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": "inline; filename=speech.mp3",
        },
    )

