import socket

import httpx
import pytest

from app.core.errors import AnalysisError
from app.services import url_reader

pytestmark = pytest.mark.anyio


@pytest.mark.parametrize(
    "url", ["http://127.0.0.1:8080/admin", "file:///etc/passwd", "https://user:pw@jobs.example"]
)
async def test_unsafe_url_raises_error(url):
    with pytest.raises(AnalysisError) as err:
        await url_reader.fetch_url_content(url)
    assert (err.value.status_code, err.value.code) == (400, "invalid_url")


async def test_redirect_to_private_address_is_never_fetched(monkeypatch):
    calls = []

    def resolve(host, port, **kwargs):
        ip = "93.184.216.34" if host == "jobs.example" else "127.0.0.1"
        return [(socket.AF_INET, 0, 0, "", (ip, port))]

    def respond(request):
        calls.append(request)
        return httpx.Response(302, headers={"Location": "http://127.0.0.1/internal"})

    client = httpx.AsyncClient
    monkeypatch.setattr(socket, "getaddrinfo", resolve)
    monkeypatch.setattr(
        url_reader.httpx,
        "AsyncClient",
        lambda **kw: client(**kw, transport=httpx.MockTransport(respond)),
    )

    with pytest.raises(AnalysisError) as err:
        await url_reader.fetch_url_content("https://jobs.example/posting")
    assert err.value.code == "invalid_url"
    assert len(calls) == 1
    assert calls[0].url.host == "93.184.216.34"
    assert calls[0].headers["Host"] == "jobs.example"
    assert calls[0].extensions["sni_hostname"] == "jobs.example"
