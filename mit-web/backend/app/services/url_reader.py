import asyncio
import ipaddress
import json
import re
import socket
from urllib.parse import urlsplit

import httpx
from bs4 import BeautifulSoup

from app.core.errors import AnalysisError

MAX_PAGE_CHARS = 10_000
MAX_PAGE_BYTES = 512 * 1024
MAX_REDIRECTS = 3
REDIRECTS = {301, 302, 303, 307, 308}
NAT64_PREFIXES = tuple(map(ipaddress.ip_network, ("64:ff9b::/96", "64:ff9b:1::/48")))
BLOCKED = (
    "just a moment...",
    "verify you are human",
    "cf-browser-verification",
    "enable javascript and cookies to continue",
    "access to this page has been denied",
    "attention required! | cloudflare",
)


def normalize_url(raw: str) -> str:
    value = raw.strip()
    return value if re.match(r"^[a-z][a-z0-9+.-]*://", value, re.I) else f"https://{value}"


def invalid_url() -> AnalysisError:
    return AnalysisError(400, "invalid_url", "Gunakan tautan HTTP(S) dengan alamat publik.")


def validate_target(url: httpx.URL) -> None:
    if (
        url.scheme not in {"http", "https"}
        or not url.host
        or url.userinfo
        or "%" in url.host
        or url.port not in {None, 443 if url.scheme == "https" else 80}
    ):
        raise invalid_url()


def resolve_public(host: str, port: int) -> str:
    try:
        addresses = [
            ipaddress.ip_address(info[4][0])
            for info in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        ]
    except socket.gaierror:
        raise unreadable_url() from None
    except ValueError:
        raise invalid_url() from None

    for ip in addresses:
        candidate = ip.ipv4_mapped if isinstance(ip, ipaddress.IPv6Address) else None
        checked = candidate or ip
        if (
            not checked.is_global
            or checked.is_multicast
            or checked.is_reserved
            or any(ip in network for network in NAT64_PREFIXES)
            or (isinstance(ip, ipaddress.IPv6Address) and (ip.sixtofour or ip.teredo))
        ):
            raise invalid_url()
    if not addresses:
        raise unreadable_url()
    return str(addresses[0])


def unreadable_url() -> AnalysisError:
    return AnalysisError(422, "url_content_unavailable", "Halaman tidak dapat dibaca.")


def extract_rich_page_content(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else "Halaman Lowongan"

    meta_desc = ""
    for attr in [
        {"name": "description"},
        {"property": "og:description"},
        {"name": "twitter:description"},
    ]:
        tag = soup.find("meta", attrs=attr)
        if tag and tag.get("content"):
            meta_desc = tag["content"].strip()
            break

    og_title = ""
    for attr in [{"property": "og:title"}, {"name": "twitter:title"}]:
        tag = soup.find("meta", attrs=attr)
        if tag and tag.get("content"):
            og_title = tag["content"].strip()
            break

    if og_title and (not title or title == "Halaman Lowongan"):
        title = og_title

    # Extract JSON-LD JobPosting schema (biasanya ada di portal karir seperti Astra/Glints/LinkedIn)
    job_schema_snippets = []
    for s in soup.find_all("script", type="application/ld+json"):
        if not s.string:
            continue
        try:
            data = json.loads(s.string.strip())
            items = data if isinstance(data, list) else [data]
            for it in items:
                if not isinstance(it, dict):
                    continue
                type_val = str(it.get("@type", "")).lower()
                if "jobposting" in type_val or "posting" in type_val:
                    j_title = it.get("title") or it.get("name")
                    j_org = it.get("hiringOrganization", {})
                    org_name = j_org.get("name") if isinstance(j_org, dict) else str(j_org)
                    j_desc = it.get("description", "")
                    clean_j_desc = re.sub(r"<[^>]+>", " ", j_desc)
                    clean_j_desc = re.sub(r"\s+", " ", clean_j_desc).strip()

                    schema_text = (
                        f"[Data lowongan (JSON-LD)]\nPosisi: {j_title or 'N/A'}"
                        f"\nPerusahaan: {org_name or 'N/A'}"
                    )
                    if it.get("employmentType"):
                        schema_text += f"\nTipe Kontrak: {it.get('employmentType')}"
                    if it.get("baseSalary"):
                        schema_text += f"\nGaji: {it.get('baseSalary')}"
                    if clean_j_desc:
                        schema_text += f"\nRincian Tugas & Kualifikasi:\n{clean_j_desc[:4000]}"
                    job_schema_snippets.append(schema_text)
        except Exception:
            pass

    # Bersihkan elemen non-konten
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"]):
        tag.decompose()

    extracted_text = soup.get_text(separator="\n", strip=True)
    lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
    cleaned_body = "\n".join(lines)

    # Gabungkan structured data + meta description + body
    parts = []
    if job_schema_snippets:
        parts.extend(job_schema_snippets)
    if meta_desc and meta_desc not in cleaned_body:
        parts.append(f"[Ringkasan Halaman]: {meta_desc}")
    if cleaned_body:
        parts.append(cleaned_body)

    final_content = "\n\n".join(parts)[:MAX_PAGE_CHARS]

    return title[:300], final_content


async def fetch_url_content(raw_url: str, timeout: float = 12.0) -> tuple[str, str]:
    try:
        target = httpx.URL(normalize_url(raw_url))
        # Validate credentials even when empty and before HTTPX normalizes the authority.
        if "@" in urlsplit(normalize_url(raw_url)).netloc:
            raise invalid_url()
        async with asyncio.timeout(timeout):
            for hop in range(MAX_REDIRECTS + 1):
                validate_target(target)
                address = await asyncio.to_thread(
                    resolve_public,
                    target.host,
                    target.port or (443 if target.scheme == "https" else 80),
                )
                pinned = target.copy_with(host=address, fragment=None)
                # One client per hop keeps a pinned-IP pool from crossing TLS hostnames.
                async with (
                    httpx.AsyncClient(trust_env=False, follow_redirects=False) as client,
                    client.stream(
                        "GET",
                        pinned,
                        headers={
                            "Host": target.netloc.decode("ascii"),
                            "Accept": "text/html, text/plain",
                            "Accept-Encoding": "identity",
                        },
                        extensions={"sni_hostname": target.raw_host.decode("ascii")},
                    ) as response,
                ):
                    if response.status_code in REDIRECTS:
                        location = response.headers.get("Location")
                        if hop == MAX_REDIRECTS or not location:
                            raise unreadable_url()
                        if "@" in urlsplit(location).netloc:
                            raise invalid_url()
                        target = target.join(location)
                        continue
                    content_type = response.headers.get("Content-Type", "").split(";")[0].lower()
                    if (
                        response.status_code != 200
                        or content_type not in {"text/html", "text/plain", "application/xhtml+xml"}
                        or response.headers.get("Content-Encoding", "identity").lower()
                        != "identity"
                    ):
                        raise unreadable_url()
                    body = bytearray()
                    async for chunk in response.aiter_bytes():
                        if len(body) + len(chunk) > MAX_PAGE_BYTES:
                            raise unreadable_url()
                        body.extend(chunk)
                    page = body.decode(response.encoding or "utf-8", errors="replace")
                    if any(pattern in page[:2000].lower() for pattern in BLOCKED):
                        raise unreadable_url()
                    if content_type == "text/plain":
                        title, content = "Lowongan", page[:MAX_PAGE_CHARS]
                    else:
                        title, content = await asyncio.to_thread(extract_rich_page_content, page)
                    if len(content.strip()) < 50:
                        raise unreadable_url()
                    return title, content
    except (httpx.InvalidURL, ValueError):
        raise invalid_url() from None
    except (TimeoutError, httpx.HTTPError, LookupError):
        raise unreadable_url() from None
    raise unreadable_url()
