import asyncio
import ipaddress
import json
import logging
import re
import socket
import urllib.parse

from bs4 import BeautifulSoup
import httpx

from app.core.errors import AnalysisError

logger = logging.getLogger("job_scam_guardian.url_reader")

URL_REGEX = re.compile(
    r"https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)",
    re.IGNORECASE,
)

MAX_PAGE_CHARS = 10_000

CLOUDFLARE_PATTERNS = [
    "attention required! | cloudflare",
    "just a moment...",
    "verify you are human",
    "cf-browser-verification",
    "enable javascript and cookies to continue",
    "access to this page has been denied",
    "please turn javascript on and reload the page",
    "checking your browser before accessing",
]


def normalize_url(raw_url: str) -> str:
    """Bersihkan dan standarisasi URL (termasuk menambahkan https jika tanpa skema)."""
    url = raw_url.strip()
    if not url:
        return ""
    # Hapus karakter pembungkus yang sering ter-copy (tanda kutip, kurung, titik di akhir)
    url = re.sub(r"^[\"'<(\[]+|[\"'>)\]\.,]+$", "", url)
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "https://" + url
    try:
        parsed = urllib.parse.urlparse(url)
        safe_path = urllib.parse.quote(urllib.parse.unquote(parsed.path), safe="/:@!$&'()*+,;=-_.~%")
        safe_query = urllib.parse.quote(urllib.parse.unquote(parsed.query), safe="=&:@!$'()*+,;=-_.~%")
        parsed = parsed._replace(path=safe_path, query=safe_query)
        return urllib.parse.urlunparse(parsed)
    except Exception:
        return url


def extract_first_url(text: str) -> str | None:
    text = text.strip()
    match = URL_REGEX.search(text)
    if match:
        return match.group(0)
    # Deteksi URL tanpa prefix http/https (misal career.astra.co.id/...)
    domain_match = re.search(
        r"\b([a-zA-Z0-9][-a-zA-Z0-9]*\.)+(?:co\.id|com|org|net|id|site|xyz|online|edu|gov|ac\.id|go\.id)\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)",
        text,
        re.IGNORECASE,
    )
    if domain_match:
        return "https://" + domain_match.group(0)
    return None


def is_safe_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False

    if parsed.scheme.lower() not in ("http", "https"):
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    # Block common local domain names
    if hostname.lower() in ("localhost", "local", "internal"):
        return False

    # Check literal IP address
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
    except ValueError:
        pass

    # Resolve domain to IP to prevent DNS rebinding SSRF
    try:
        addrinfo = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in addrinfo:
            ip_str = sockaddr[0]
            ip = ipaddress.ip_address(ip_str)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
    except (socket.gaierror, ValueError):
        # Could be DNS lookup error; allow httpx to fail gracefully if unreachable
        pass

    return True


def is_blocked_content(text: str) -> bool:
    low = text[:1500].lower()
    return any(p in low for p in CLOUDFLARE_PATTERNS)


def extract_rich_page_content(html: str, url: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else "Halaman Lowongan"

    meta_desc = ""
    for attr in [{"name": "description"}, {"property": "og:description"}, {"name": "twitter:description"}]:
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

                    schema_text = f"[Skema Lowongan Resmi (JSON-LD)]\nPosisi: {j_title or 'N/A'}\nPerusahaan: {org_name or 'N/A'}"
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

    # Jika konten masih sangat minim (misal SPA tanpa SSR seperti React biasa)
    if len(final_content.strip()) < 50:
        parsed_url = urllib.parse.urlparse(url)
        path_segments = [urllib.parse.unquote(p) for p in parsed_url.path.split("/") if p]
        inferred_info = " / ".join(path_segments)
        final_content = (
            f"[Informasi Halaman Karir (Single-Page Application)]\n"
            f"Domain Web: {parsed_url.netloc}\n"
            f"Judul Dokumen: {title}\n"
            f"Segmen Lowongan Terindikasi: {inferred_info}\n"
        )
        if meta_desc:
            final_content += f"Deskripsi Meta: {meta_desc}\n"
        if cleaned_body:
            final_content += f"Teks yang Terbaca: {cleaned_body}\n"

    return title, final_content


async def fetch_url_content(url: str, timeout: float = 20.0) -> tuple[str, str]:
    """Mengambil teks halaman web secara aman dan andal via Jina Reader atau HTTP fetch fallback."""
    normalized = normalize_url(url)
    if not is_safe_url(normalized):
        raise AnalysisError(
            400,
            "invalid_url",
            "Tautan tidak valid atau mengarah ke alamat jaringan privat/internal.",
        )

    # 1. Coba Jina Reader (menangani JavaScript-rendered job portals seperti Glints/Jobstreet/Astra)
    jina_url = f"https://r.jina.ai/{normalized}"
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            res = await client.get(
                jina_url,
                headers={
                    "User-Agent": "JobScamGuardian/1.0 (+https://github.com/jona-2212/MIT_WEEK2026)",
                    "Accept": "text/markdown, text/plain",
                    "X-Return-Format": "markdown",
                    "X-With-Generated-Alt": "true",
                    "X-Timeout": "16",
                },
            )
            if res.status_code == 200 and len(res.text.strip()) > 80:
                raw_text = res.text
                if not is_blocked_content(raw_text):
                    title = "Halaman Lowongan"
                    title_match = re.search(r"^Title:\s*(.+)$", raw_text, re.MULTILINE)
                    if title_match:
                        title = title_match.group(1).strip()
                    cleaned = raw_text[:MAX_PAGE_CHARS]
                    return title, cleaned
                logger.warning(f"Jina reader terkena proteksi bot untuk {normalized}, beralih ke fetch langsung.")
    except Exception as e:
        logger.warning(f"Jina reader gagal untuk {normalized}: {e}, mencoba fetch langsung.")

    # 2. Fallback direct HTTP fetch dengan browser headers lengkap & SSL fallback
    browser_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    }

    try:
        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, verify=True) as client:
                res = await client.get(normalized, headers=browser_headers)
        except (httpx.ConnectError, httpx.SecurityError) as ssl_err:
            logger.warning(f"SSL verification gagal untuk {normalized} ({ssl_err}), mencoba verify=False.")
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, verify=False) as client:
                res = await client.get(normalized, headers=browser_headers)

        if res.status_code >= 400:
            parsed = urllib.parse.urlparse(normalized)
            path_segments = [urllib.parse.unquote(p) for p in parsed.path.split("/") if p]
            inferred_job = " / ".join(path_segments) if path_segments else "Halaman Karir"
            fallback_text = (
                f"[Tautan Resmi: {normalized}]\n"
                f"Domain: {parsed.netloc}\n"
                f"Status Akses Web: Terproteksi/Login Wajib ({res.status_code})\n"
                f"Informasi URL Terindikasi: {inferred_job}\n\n"
                f"Catatan: Halaman web ini membatasi akses bot otomatis. AI menganalisis validitas domain pengirim ({parsed.netloc})."
            )
            return inferred_job, fallback_text

        title, cleaned = extract_rich_page_content(res.text, normalized)
        return title, cleaned

    except AnalysisError:
        raise
    except httpx.TimeoutException:
        parsed = urllib.parse.urlparse(normalized)
        path_segments = [urllib.parse.unquote(p) for p in parsed.path.split("/") if p]
        inferred_job = " / ".join(path_segments) if path_segments else "Tautan Karir"
        return inferred_job, (
            f"[Sumber URL: {normalized}]\n"
            f"Domain: {parsed.netloc}\n"
            f"Koneksi ke server lambat/timeout. Analisis dilakukan berdasarkan kredibilitas domain dan struktur tautan."
        )
    except Exception as e:
        logger.error(f"Gagal mengambil URL {normalized}: {e}")
        parsed = urllib.parse.urlparse(normalized)
        path_segments = [urllib.parse.unquote(p) for p in parsed.path.split("/") if p]
        inferred_job = " / ".join(path_segments) if path_segments else "Tautan Karir"
        return inferred_job, (
            f"[Sumber URL: {normalized}]\n"
            f"Domain: {parsed.netloc}\n"
            f"Status: Server web tidak merespons ({type(e).__name__}). Analisis berfokus pada keaslian domain."
        )
