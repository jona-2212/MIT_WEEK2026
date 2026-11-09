import httpx
import pytest

from app.core.config import Settings
from app.main import create_app
from tests.factories import envelope, open_test_client

pytestmark = pytest.mark.anyio
CASE = "A fictional job offer asks the applicant to pay a uniform fee."


async def test_no_key_gives_explicit_fallback_and_generator_error():
    app = create_app(Settings(_env_file=None))
    async with open_test_client(app) as client:
        assert (await client.get("/api/v1/roleplay/scenarios")).status_code == 200
        chat = await client.post("/api/v1/roleplay/chat", json={"message": "Halo"})
        assert chat.json()["mode"] == "fallback"
        result = await client.post("/api/v1/roleplay/custom", json={"user_prompt": CASE})
        assert result.status_code == 503
        assert result.json()["error"]["code"] == "provider_not_configured"


async def test_guided_catalog_keeps_answer_ids_and_scores_across_languages():
    app = create_app(Settings(_env_file=None))
    async with open_test_client(app) as client:
        endpoint = "/api/v1/roleplay/scenarios"
        id_catalog = (await client.get(f"{endpoint}?lang=id")).json()
        en_catalog = (await client.get(f"{endpoint}?lang=en")).json()

    assert len(id_catalog) == len(en_catalog) == 5
    for id_scenario, en_scenario in zip(id_catalog, en_catalog, strict=True):
        assert id_scenario["id"] == en_scenario["id"]
        assert id_scenario["language"] == "ID"
        assert en_scenario["language"] == "EN"
        for id_question, en_question in zip(
            id_scenario["questions"], en_scenario["questions"], strict=True
        ):
            assert id_question["question_number"] == en_question["question_number"]
            assert [(o["id"], o["is_correct"]) for o in id_question["options"]] == [
                (o["id"], o["is_correct"]) for o in en_question["options"]
            ]


@pytest.mark.parametrize("language", ["ID", "EN"])
async def test_generated_scenario_is_private_and_uses_curated_rubric(language):
    context = {
        "title": "Fictional uniform fee",
        "description": "A fictional applicant is asked for a fee during recruitment.",
        "template_id": "wfh-deposit",
    }
    app = create_app(
        Settings(_env_file=None, gemini_api_key="test"),
        provider_transport=httpx.MockTransport(
            lambda _: httpx.Response(200, json=envelope(context))
        ),
    )
    async with open_test_client(app) as client:
        catalog_url = f"/api/v1/roleplay/scenarios?lang={language.lower()}"
        catalog = (await client.get(catalog_url)).json()
        result = await client.post(
            "/api/v1/roleplay/custom", json={"user_prompt": CASE, "language": language}
        )
        assert result.status_code == 200
        scenario = result.json()
        assert len(catalog) == 5
        assert scenario["id"].startswith("custom-")
        assert scenario["language"] == language
        assert scenario["questions"] == catalog[0]["questions"]
        assert all(sum(o["is_correct"] for o in q["options"]) == 1 for q in scenario["questions"])
        assert (await client.get(catalog_url)).json() == catalog

        context["questions"] = [{"options": [{"text": "Send OTP", "is_correct": "false"}]}]
        result = await client.post("/api/v1/roleplay/custom", json={"user_prompt": CASE})
        assert result.status_code == 502
        assert (await client.get(catalog_url)).json() == catalog


async def test_tts_uses_full_text_and_private_post():
    calls = []

    def tts(request):
        text = request.url.params["q"]
        calls.append(text)
        assert len(text) <= 160
        return httpx.Response(200, headers={"Content-Type": "audio/mpeg"}, content=text.encode())

    app = create_app(Settings(_env_file=None), provider_transport=httpx.MockTransport(tts))
    async with open_test_client(app) as client:
        endpoint = "/api/v1/roleplay/tts"
        first = {"text": "a" * 180 + "X", "lang": "en"}
        second = {"text": "a" * 180 + "Y", "lang": "en"}
        response = await client.post(endpoint, json=first)
        other = await client.post(endpoint, json=second)
        again = await client.post(endpoint, json=first)
        assert response.headers["Cache-Control"] == "no-store"
        assert response.content.endswith(b"X") and other.content.endswith(b"Y")
        assert again.content == response.content
        assert len(calls) == 4
        assert (await client.get(endpoint)).status_code == 405
