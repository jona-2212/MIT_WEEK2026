import pytest

from app.core.errors import AnalysisError
from app.services.url_reader import extract_first_url, is_safe_url, fetch_url_content


def test_extract_first_url():
    assert extract_first_url("cek lowongan https://example.com/job segera") == "https://example.com/job"
    assert extract_first_url("tidak ada url di sini") is None
    assert extract_first_url("http://test.org/path?a=1&b=2") == "http://test.org/path?a=1&b=2"


def test_is_safe_url():
    assert is_safe_url("https://glints.com/id/opportunities") is True
    assert is_safe_url("http://localhost") is False
    assert is_safe_url("http://127.0.0.1:8000") is False
    assert is_safe_url("http://192.168.1.1") is False
    assert is_safe_url("http://10.0.0.1/secret") is False
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("ftp://example.com") is False


@pytest.mark.anyio
async def test_unsafe_url_raises_error():
    with pytest.raises(AnalysisError) as exc_info:
        await fetch_url_content("http://127.0.0.1:8080/admin")
    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "invalid_url"
