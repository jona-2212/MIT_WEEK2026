from fastapi import APIRouter, Request

from app.schemas.roleplay import (
    GenerateCustomScenarioRequest,
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
async def list_scenarios(request: Request) -> list[Scenario]:
    service = getattr(request.app.state, "roleplay_service", None)
    if not service:
        from app.services.roleplay import RoleplayService

        service = RoleplayService(request.app.state.settings)
        request.app.state.roleplay_service = service
    return service.get_scenarios()


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
