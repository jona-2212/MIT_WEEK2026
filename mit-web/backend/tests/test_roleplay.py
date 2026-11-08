import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.config import Settings


@pytest.fixture
def client():
    app = create_app(Settings())
    return TestClient(app)


def test_list_scenarios_has_at_least_5(client):
    response = client.get("/api/v1/roleplay/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    assert all(s["version"] == "roleplay-v1" for s in data)


def test_create_custom_scenario(client):
    response = client.post(
        "/api/v1/roleplay/custom",
        json={"user_prompt": "Ada tawaran kerja admin online tapi disuruh kirim deposit Rp50.000 untuk materai"},
    )
    assert response.status_code == 200
    custom = response.json()
    assert custom["id"].startswith("custom-")
    assert custom["title"] != ""
    assert custom["objective"] != ""

    # Test starting the custom scenario
    start_resp = client.post("/api/v1/roleplay/start", json={"scenario_id": custom["id"]})
    assert start_resp.status_code == 200
    session = start_resp.json()
    assert session["scenario_id"] == custom["id"]
    assert len(session["messages"]) == 1


def test_start_and_turn_flow(client):
    start_resp = client.post("/api/v1/roleplay/start", json={"scenario_id": "apk-phishing"})
    assert start_resp.status_code == 200
    session = start_resp.json()
    assert session["roleplay_version"] == "roleplay-v1"
    assert session["scenario_id"] == "apk-phishing"
    assert session["turn_index"] == 1
    assert len(session["messages"]) == 1
    assert session["messages"][0]["role"] == "recruiter"

    token = session["session_token"]

    turn_resp = client.post(
        "/api/v1/roleplay/turn",
        json={
            "session_token": token,
            "message": "Saya tidak mau instal file apk karena berisiko malware. Mohon kirim format PDF.",
        },
    )
    assert turn_resp.status_code == 200
    updated = turn_resp.json()
    assert updated["turn_index"] == 2
    assert len(updated["messages"]) == 3
    assert updated["messages"][1]["role"] == "user"
    assert updated["messages"][2]["role"] == "recruiter"
    assert updated["report"] is not None
    assert isinstance(updated["report"]["skills"], list)
