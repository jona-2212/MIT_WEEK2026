import asyncio
import ipaddress
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

MAX_PAGE_CHARS = 8_000


def extract_first_url(text: str) -> str | None:
    text = text.strip()
    match = URL_REGEX.search(text)
    return match.group(0) if match else None


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


async def fetch_url_content(url: str, timeout: float = 12.0) -> tuple[str, str]:
    """Mengambil teks halaman web secara aman via Jina Reader atau HTTP fetch fallback."""
    if not is_safe_url(url):
        raise AnalysisError(
            400,
            "invalid_url",
            "Tautan tidak valid atau mengarah ke alamat jaringan privat/internal.",
        )

    # 1. Coba Jina Reader (menangani JavaScript-rendered job portals seperti Glints/Jobstreet)
    jina_url = f"https://r.jina.ai/{url}"
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            res = await client.get(
                jina_url,
                headers={
                    "User-Agent": "JobScamGuardian/1.0 (+https://github.com/jona-2212/MIT_WEEK2026)",
                    "Accept": "text/markdown, text/plain",
                },
            )
            if res.status_code == 200 and len(res.text.strip()) > 80:
                raw_text = res.text
                title = "Halaman Lowongan"
                title_match = re.search(r"^Title:\s*(.+)$", raw_text, re.MULTILINE)
                if title_match:
                    title = title_match.group(1).strip()
                cleaned = raw_text[:MAX_PAGE_CHARS]
                return title, cleaned
    except Exception as e:
        logger.warning(f"Jina reader gagal untuk {url}: {e}, mencoba fetch langsung.")

    # 2. Fallback direct HTTP fetch
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            res = await client.get(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                    ),
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                },
            )
            if res.status_code >= 400:
                raise AnalysisError(
                    400,
                    "url_fetch_failed",
                    f"Halaman web mengembalikan status error ({res.status_code}). "
                    "Pastikan tautan lowongan kerja dapat diakses publik.",
                )

            soup = BeautifulSoup(res.text, "html.parser")
            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else "Halaman Lowongan"

            # Buang elemen yang bukan isi konten
            for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"]):
                tag.decompose()

            extracted_text = soup.get_text(separator="\n", strip=True)
            # Hilangkan baris kosong berlebihan
            lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
            cleaned = "\n".join(lines)[:MAX_PAGE_CHARS]

            if len(cleaned) < 50:
                raise AnalysisError(
                    400,
                    "url_content_insufficient",
                    "Konten dari tautan tersebut terlalu sedikit atau membutuhkan autentikasi/login. "
                    "Silakan salin-tempel teks lowongan atau gunakan screenshot.",
                )

            return title, cleaned
    except AnalysisError:
        raise
    except httpx.TimeoutException:
        raise AnalysisError(
            504,
            "url_timeout",
            "Batas waktu koneksi ke tautan terlampaui. Situs web mungkin lambat atau tidak dapat diakses.",
        )
    except Exception as e:
        logger.error(f"Gagal mengambil URL {url}: {e}")
        raise AnalysisError(
            400,
            "url_fetch_failed",
            "Gagal mengambil data dari tautan. Pastikan tautan aktif dan dapat dibuka publik.",
        )

