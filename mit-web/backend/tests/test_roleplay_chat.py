import json
import time

import httpx
import pytest

from app.core.config import Settings
from app.main import create_app
from app.services.roleplay_chat import RecruiterRoleplayService
from tests.factories import envelope, open_test_client

pytestmark = pytest.mark.anyio


def interpretation(action="ask_details", quote="Bisa jelaskan prosesnya?", uncertain=False):
    return {"action": action, "quote": quote, "uncertain": uncertain}


def setup(responses=(), **overrides):
    calls = []
    results = iter(responses)

    def handle(request):
        calls.append(json.loads(request.content))
        result = next(results)
        if isinstance(result, Exception):
            raise result
        if isinstance(result, httpx.Response):
            return result
        return httpx.Response(200, json=envelope(result))

    settings = Settings(
        _env_file=None,
        gemini_api_key="synthetic-test-key",
        roleplay_signing_secret="synthetic-only-signing-secret-12345",
        **overrides,
    )
    return create_app(settings, provider_transport=httpx.MockTransport(handle)), calls


async def start(client, scenario="uniform_deposit"):
    response = await client.post("/api/v1/roleplay/start", json={"scenario_id": scenario})
    assert response.status_code == 200
    return response.json()


async def send(client, session, message="Bisa jelaskan prosesnya?", turn_id="turn-1"):
    return await client.post(
        "/api/v1/roleplay/turn",
        json={
            "session_token": session["session_token"],
            "client_turn_id": turn_id,
            "message": message,
        },
    )


async def test_catalog_start_and_health_never_call_provider():
    app, calls = setup()
    async with open_test_client(app) as client:
        catalog = (await client.get("/api/v1/roleplay/chat-scenarios")).json()
        assert {s["id"] for s in catalog} == {"uniform_deposit", "task_deposit"}
        session = await start(client)
        assert session["outcome"] == "active" and session["turn_index"] == 0
        assert len(session["messages"]) == 1
        assert all(s["status"] == "unobserved" for s in session["report"]["skills"])
        assert (await client.get("/health")).status_code == 200
        schema = (await client.get("/openapi.json")).json()
        assert (
            "application/json"
            in schema["paths"]["/api/v1/roleplay/turn"]["post"]["requestBody"]["content"]
        )
    assert calls == []


async def test_english_catalog_and_session_keep_language_through_report():
    message = "Can you explain the recruitment process?"
    actor_reply = "The deposit reserves the interview slot."
    app, calls = setup(
        [
            interpretation(quote=message),
            {"message": actor_reply},
            interpretation("agree_to_payment", "agree to pay"),
        ]
    )
    async with open_test_client(app) as client:
        path = "/api/v1/roleplay"
        id_catalog = (await client.get(f"{path}/chat-scenarios")).json()
        en_catalog = (await client.get(f"{path}/chat-scenarios?lang=en")).json()
        assert [item["id"] for item in en_catalog] == [item["id"] for item in id_catalog]
        assert all(item["language"] == "EN" for item in en_catalog)
        assert en_catalog[0]["title"] == "Uniform deposit before the interview"

        started = await client.post(
            f"{path}/start", json={"scenario_id": "uniform_deposit", "language": "EN"}
        )
        assert started.status_code == 200
        session = started.json()
        assert session["language"] == "EN"
        assert "uniform deposit" in session["messages"][0]["text"]
        assert session["hint"].startswith("Notice whether")
        assert not calls

        turned = await send(client, session, message)
        assert turned.status_code == 200
        session = turned.json()
        assert session["language"] == "EN"
        assert session["messages"][-1]["text"] == actor_reply
        assert session["report"]["moments"][0]["quote"] == message
        assert session["report"]["moments"][0]["explanation"].startswith("You asked")
        assert session["report"]["skills"][0]["label"] == "Checking the process"
        assert session["report"]["safe_reply"].startswith("Thank you.")
        assert "only in English" in calls[1]["systemInstruction"]["parts"][0]["text"]

        clarified = await send(client, session, "I don't agree to pay.", turn_id="turn-2")
        assert clarified.status_code == 200
        assert clarified.json()["outcome"] == "active"
        assert clarified.json()["messages"][-1]["text"].startswith("Would you like")
    assert len(calls) == 3


async def test_eight_unicode_turns_fit_the_signed_snapshot_limit():
    text = "".join(chr(0x1F300 + i % 250) for i in range(1000))
    reply = "".join(chr(0x1F500 + i % 50) for i in range(600))
    responses = []
    for index in range(8):
        responses.append(interpretation("ask_details", text))
        if index < 7:
            responses.append({"message": reply})
    app, calls = setup(responses)
    async with open_test_client(app) as client:
        session = await start(client)
        for index in range(8):
            response = await send(client, session, text, f"unicode-{index}")
            assert response.status_code == 200
            session = response.json()
            assert len(session["session_token"]) < 80_000
        assert session["outcome"] == "needs_clarification"
    assert len(calls) == 15


@pytest.mark.parametrize("missing", ["gemini_api_key", "roleplay_signing_secret"])
async def test_missing_keys_keep_health_and_return_honest_error(missing):
    settings = Settings(
        _env_file=None,
        roleplay_signing_secret="x" * 32 if missing == "gemini_api_key" else None,
        gemini_api_key="synthetic" if missing == "roleplay_signing_secret" else None,
    )
    app = create_app(settings)
    async with open_test_client(app) as client:
        assert (await client.get("/health")).status_code == 200
        result = await client.post("/api/v1/roleplay/start", json={"scenario_id": "task_deposit"})
        assert result.status_code == 503
        assert "session_token" not in result.json()


async def test_two_phase_turn_grounded_report_and_no_key_in_payload(capsys):
    app, calls = setup(
        [interpretation(), {"message": "Deposit diperlukan untuk reservasi jadwal fiktif."}]
    )
    async with open_test_client(app) as client:
        session = await start(client)
        response = await send(client, session)
    assert response.status_code == 200
    result = response.json()
    assert result["turn_index"] == 1 and len(result["messages"]) == 3
    assert result["report"]["skills"][0]["status"] == "observed"
    moment = result["report"]["moments"][0]
    assert moment["quote"] == "Bisa jelaskan prosesnya?"
    assert moment["trigger"] == session["messages"][0]["text"]
    assert len(calls) == 2
    assert calls[1]["generationConfig"]["responseFormat"]["text"]["schema"]["properties"].get(
        "message"
    )
    assert "synthetic-test-key" not in json.dumps(calls) + capsys.readouterr().out
    assert session["session_token"] not in capsys.readouterr().out


async def test_independent_verification_then_refusal_ends_without_actor_call():
    verify = "Saya cari kontak resmi sendiri sebelum melanjutkan."
    refuse = "Saya menolak deposit ini dan berhenti."
    app, calls = setup(
        [
            interpretation("verify_independently", verify),
            {"message": "Apakah kamu ingin menunda?"},
            interpretation("refuse_request", refuse),
        ]
    )
    async with open_test_client(app) as client:
        session = await start(client)
        session = (await send(client, session, verify)).json()
        result = (await send(client, session, refuse, "turn-2")).json()
        assert result["outcome"] == "verified_exit"
        assert (await send(client, result, refuse, "turn-3")).status_code == 409
    assert len(calls) == 3


@pytest.mark.parametrize(
    "action,outcome",
    [
        ("agree_to_payment", "risky_choice"),
        ("agree_to_share_sensitive_data", "risky_choice"),
        ("end_conversation", "stopped"),
    ],
)
async def test_terminal_decisions_use_only_interpreter(action, outcome):
    text = {
        "agree_to_payment": "Saya setuju akan bayar dalam simulasi.",
        "agree_to_share_sensitive_data": "Saya akan kirim OTP dalam simulasi.",
        "end_conversation": "Saya mengakhiri percakapan.",
    }[action]
    app, calls = setup([interpretation(action, text)])
    async with open_test_client(app) as client:
        session = await start(client)
        result = (await send(client, session, text)).json()
    assert result["outcome"] == outcome
    assert len(calls) == 1
    if outcome == "risky_choice":
        assert result["report"]["skills"][2]["status"] == "practice"


@pytest.mark.parametrize(
    "value",
    [
        interpretation("agree_to_payment", "kutipan yang tidak ada"),
        interpretation("agree_to_payment", "Bisa jelaskan prosesnya?", True),
        interpretation("ask_details", ""),
    ],
)
async def test_ungrounded_or_uncertain_actions_only_clarify(value):
    app, calls = setup([value])
    async with open_test_client(app) as client:
        result = (await send(client, await start(client))).json()
    assert result["outcome"] == "active"
    assert result["report"]["moments"] == []
    assert all(s["status"] == "unobserved" for s in result["report"]["skills"])
    assert len(calls) == 1


async def test_negation_stays_data_in_prompt_and_uses_interpreters_context():
    text = "Kalau diminta transfer, saya menolak."
    app, calls = setup(
        [interpretation("refuse_request", text), {"message": "Ingin menunda jadwal?"}]
    )
    async with open_test_client(app) as client:
        result = (await send(client, await start(client), text)).json()
    assert result["outcome"] == "active"
    assert result["report"]["skills"][2]["status"] == "observed"
    assert "Negasi/hipotesis" in calls[0]["systemInstruction"]["parts"][0]["text"]
    assert json.loads(calls[0]["contents"][0]["parts"][0]["text"])["message"] == text


async def test_limit_and_off_topic_redirect_no_hidden_penalties():
    text = "Mari bahas cuaca saja."
    app, calls = setup([interpretation("off_topic", text)] * 8)
    async with open_test_client(app) as client:
        session = await start(client, "task_deposit")
        for index in range(8):
            session = (await send(client, session, text, f"turn-{index}")).json()
            if index == 1:
                assert "Akhiri latihan" in session["messages"][-1]["text"]
        assert session["outcome"] == "needs_clarification"
        assert session["turn_index"] == 8
        assert (await send(client, session)).status_code == 409
    assert len(calls) == 8


@pytest.mark.parametrize(
    "message", ["OTP saya 123456", "rekening 123456789012", "email saya test@example.invalid"]
)
async def test_sensitive_input_rejected_before_ai(message):
    app, calls = setup()
    async with open_test_client(app) as client:
        response = await send(client, await start(client), message)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "sensitive_input"
    assert calls == []


@pytest.mark.parametrize("bad_token", ["invalid", "x.☃", "x." + "a" * 64])
async def test_invalid_tokens_never_call_ai(bad_token):
    app, calls = setup()
    async with open_test_client(app) as client:
        session = await start(client)
        session["session_token"] = bad_token
        response = await send(client, session)
    assert response.status_code == 400
    assert calls == []


async def test_tampering_expiry_and_duplicate_ids_rejected():
    app, calls = setup([interpretation(), {"message": "Ingin menunda jadwal?"}])
    async with open_test_client(app) as client:
        session = await start(client)
        token = session["session_token"]
        session["session_token"] = ("A" if token[0] != "A" else "B") + token[1:]
        assert (await send(client, session)).status_code == 400
        service: RecruiterRoleplayService = app.state.recruiter_service
        expired = service.decode(token)
        expired.expires_at = int(time.time()) - 1
        session["session_token"] = service.encode(expired)
        assert (await send(client, session)).status_code == 410
        session["session_token"] = token
        result = (await send(client, session)).json()
        assert (await send(client, result)).status_code == 409
    assert len(calls) == 2


@pytest.mark.parametrize(
    "failure,status",
    [
        (httpx.Response(429), 503),
        (httpx.Response(404), 503),
        (httpx.ReadTimeout("private"), 504),
        (httpx.ConnectError("private"), 503),
        (httpx.Response(200, json={"candidates": []}), 502),
        ({"action": "invented", "quote": "test", "uncertain": False}, 502),
    ],
)
async def test_provider_errors_sanitized_and_no_state_commit(failure, status):
    app, _ = setup([failure])
    async with open_test_client(app) as client:
        session = await start(client)
        response = await send(client, session)
        assert response.status_code == status
        assert "private" not in response.text
        assert app.state.recruiter_service.decode(session["session_token"]).turn_index == 0


@pytest.mark.parametrize(
    "message",
    ["Bayar lewat https://example.invalid", "Hubungi 081234567890", "<script>kode</script>"],
)
async def test_unsafe_actor_output_is_not_returned_or_committed(message):
    app, calls = setup([interpretation(), {"message": message}])
    async with open_test_client(app) as client:
        session = await start(client)
        result = await send(client, session)
        assert result.status_code == 502
        assert message not in result.text
        assert app.state.recruiter_service.decode(session["session_token"]).turn_index == 0
    assert len(calls) == 2


async def test_json_limits_content_type_and_validation_before_ai():
    app, calls = setup()
    async with open_test_client(app) as client:
        path = "/api/v1/roleplay/turn"
        assert (
            await client.post(path, content="{}", headers={"content-type": "text/plain"})
        ).status_code == 415
        assert (
            await client.post(path, content="{", headers={"content-type": "application/json"})
        ).status_code == 422
        assert (await client.post(path, json={"extra": "value"})).status_code == 422

        async def oversized():
            yield b" " * (96 * 1024)
            yield b" "

        assert (
            await client.post(
                path, content=oversized(), headers={"content-type": "application/json"}
            )
        ).status_code == 413
        session = await start(client)
        assert (await send(client, session, "x" * 1001)).status_code == 422
        assert (await send(client, session, " ")).status_code == 422
    assert calls == []


async def test_risky_classification_with_negated_quote_is_ignored():
    app, calls = setup([interpretation("agree_to_payment", "akan bayar")])
    async with open_test_client(app) as client:
        session = await start(client)
        result = await send(client, session, "Saya tidak akan bayar biaya seragam.")
    assert result.json()["outcome"] == "active"
    assert not result.json()["report"]["moments"]
    assert len(calls) == 1
