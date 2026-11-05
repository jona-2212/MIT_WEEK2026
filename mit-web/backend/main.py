from __future__ import annotations

import re
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Jeli API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class JobAnalysisRequest(BaseModel):
    input_type: Literal["text", "url", "image"]
    content: str = Field(min_length=1, max_length=50_000)
    language: Literal["ID", "EN"] = "ID"


class CompanySearchRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)


SCAM_RULES = [
    (
        re.compile(r"transfer|deposit|biaya|bayar|uang muka|rekening|fee|payment", re.I),
        35,
        "Meminta pembayaran atau deposit sebelum bekerja.",
    ),
    (
        re.compile(r"refund|reimburse|dikembalikan|jaminan|refunded|reimbursed", re.I),
        15,
        "Menjanjikan pengembalian uang untuk membuat permintaan biaya terlihat aman.",
    ),
    (
        re.compile(r"(gaji|salary|komisi).{0,80}(rp|juta|\$|million|per month|/bulan)", re.I),
        15,
        "Menawarkan pendapatan tinggi dengan pola yang perlu diverifikasi.",
    ),
    (
        re.compile(r"30 menit|segera|sekarang|slot|terbatas|urgent|hurry|within \d+", re.I),
        15,
        "Menggunakan tekanan waktu agar pengguna segera mengambil keputusan.",
    ),
    (
        re.compile(r"ktp|nik|rekening|password|otp|selfie|sensitive|personal data", re.I),
        20,
        "Meminta data pribadi atau sensitif.",
    ),
    (
        re.compile(r"gmail|yahoo|telegram|wa\.me|bit\.ly|tinyurl|\.xyz|\.top|\.site", re.I),
        15,
        "Menggunakan kanal atau domain yang perlu diverifikasi lebih lanjut.",
    ),
]

EN_INDICATORS = {
    "Meminta pembayaran atau deposit sebelum bekerja.": "Requests a payment or deposit before employment.",
    "Menjanjikan pengembalian uang untuk membuat permintaan biaya terlihat aman.": "Promises a refund to make an upfront fee appear safe.",
    "Menawarkan pendapatan tinggi dengan pola yang perlu diverifikasi.": "Offers unusually high earnings that require verification.",
    "Menggunakan tekanan waktu agar pengguna segera mengambil keputusan.": "Uses time pressure to force a rushed decision.",
    "Meminta data pribadi atau sensitif.": "Requests personal or sensitive information.",
    "Menggunakan kanal atau domain yang perlu diverifikasi lebih lanjut.": "Uses a channel or domain that needs additional verification.",
    "URL memakai domain atau pemendek tautan yang mencurigakan.": "The URL uses a suspicious domain or link shortener.",
    "Pastikan URL benar-benar mengarah ke situs resmi perusahaan.": "Verify that the URL leads to the company's official website.",
    "Tidak ada indikator otomatis yang terdeteksi dari input ini.": "No automatic indicators were detected in this input.",
}


@app.get("/")
def read_root() -> dict[str, str]:
    return {"status": "success", "message": "Jeli API aktif."}


@app.post("/api/analyze-job")
def analyze_job(request: JobAnalysisRequest) -> dict[str, object]:
    content = request.content.strip()
    score = 10 if request.input_type == "url" else 0
    indicators: list[str] = []

    for pattern, points, explanation in SCAM_RULES:
        if pattern.search(content):
            score += points
            indicators.append(explanation)

    if request.input_type == "url":
        if re.search(r"\.xyz|\.top|\.site|bit\.ly|tinyurl|wa\.me", content, re.I):
            score += 20
            indicators.append("URL memakai domain atau pemendek tautan yang mencurigakan.")
        elif not re.match(r"https?://", content, re.I):
            raise HTTPException(status_code=422, detail="URL harus diawali http:// atau https://.")
        else:
            indicators.append("Pastikan URL benar-benar mengarah ke situs resmi perusahaan.")

    score = min(score, 99)
    level = "high" if score >= 60 else "medium" if score >= 30 else "low"
    summary = {
        "high": "Jangan transfer uang atau mengirim data sensitif sebelum identitas perusahaan terverifikasi.",
        "medium": "Ada beberapa sinyal yang perlu diperiksa melalui kanal resmi perusahaan.",
        "low": "Belum ditemukan pola risiko kuat, tetapi hasil ini bukan jaminan bahwa tawaran tersebut aman.",
    }[level]

    if request.language == "EN":
        summary = {
            "high": "Do not transfer money or share sensitive data until the company is independently verified.",
            "medium": "Several signals should be checked through the company's official channels.",
            "low": "No strong risk pattern was found, but this result does not guarantee the offer is safe.",
        }[level]
        indicators = [EN_INDICATORS.get(item, item) for item in indicators]
        if not indicators:
            indicators = ["No automatic indicators were detected in this input."]

    return {
        "score": score,
        "risk_level": level,
        "summary": summary,
        "indicators": indicators or ["Tidak ada indikator otomatis yang terdeteksi dari input ini."],
        "recommendations": (
            [
                "Verify the company through its official website and channels.",
                "Do not share OTPs, passwords, or sensitive documents.",
                "Report the offer if it requests payment or creates time pressure.",
            ]
            if request.language == "EN"
            else [
                "Verifikasi perusahaan melalui situs dan kanal resmi.",
                "Jangan membagikan OTP, password, atau dokumen sensitif.",
                "Laporkan tawaran jika terdapat permintaan transfer atau tekanan waktu.",
            ]
        ),
        "source": "mock-rule-engine",
        "disclaimer": (
            "This is a rule-based indication, not proof that an offer is safe or fraudulent."
            if request.language == "EN"
            else "Hasil ini adalah indikasi berbasis aturan, bukan bukti pasti."
        ),
    }


AHU_SEARCH_URL = "https://ahu.go.id/pencarian/profil-pt/"


def fetch_ahu_profile(name: str) -> tuple[str, str]:
    url = f"{AHU_SEARCH_URL}?tipe=perseroan&nama={quote_plus(name)}"
    request = Request(
        url,
        headers={
            "Accept": "text/html",
            "User-Agent": "Jeli/1.0 (company verification; contact project owner)",
        },
    )
    try:
        with urlopen(request, timeout=12) as response:
            return url, response.read().decode("utf-8", errors="replace")
    except (HTTPError, URLError, TimeoutError) as error:
        raise HTTPException(
            status_code=502,
            detail="Layanan AHU tidak dapat diakses sekarang. Coba lagi nanti.",
        ) from error


def parse_ahu_profile(html: str, requested_name: str) -> dict[str, str] | None:
    lowered = html.lower()
    if "pencarian tidak ditemukan" in lowered:
        return None

    def value_after(*labels: str) -> str:
        for label in labels:
            match = re.search(
                rf"{re.escape(label)}\s*</[^>]+>\s*(?:<[^>]+>\s*)*([^<]+)",
                html,
                re.I,
            )
            if match:
                return " ".join(match.group(1).split())
        return ""

    name = value_after("Nama Perseroan", "Nama Perusahaan") or requested_name
    registration_number = value_after("Nomor SK", "Nomor Keputusan")
    address = value_after("Alamat")
    status = value_after("Status")
    if not registration_number and not address and not status:
        return None
    return {
        "name": name,
        "registration_number": registration_number,
        "address": address,
        "status": "active" if status.lower() in {"aktif", "active"} else "inactive",
    }


@app.post("/api/company-search")
def search_company(request: CompanySearchRequest) -> dict[str, object]:
    requested_name = request.name.strip()
    official_url, html = fetch_ahu_profile(requested_name)
    result = parse_ahu_profile(html, requested_name)
    return {
        "found": result is not None,
        "company": result,
        "source": "ahu-online",
        "official_url": official_url,
        "disclaimer": (
            "Data diambil dari halaman resmi Ditjen AHU Online. "
            "Pastikan kembali detailnya sebelum mengambil keputusan."
        ),
    }
