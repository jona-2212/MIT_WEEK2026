# Job Scam Guardian AI

Backend AI untuk MIT-WEEK 2026, mengikuti [Product Blueprint](<01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>). Produk membantu pencari kerja Indonesia mengenali indikasi penipuan rekrutmen, belajar merespons, dan memahami langkah perlindungan. Skor bersifat indikatif, bukan kepastian penipuan.

**Status: Fase C — Fitur 01 Recognition, versi 0.2.0.** Tersedia satu endpoint teks/gambar/gabungan, adaptor Gemini multimodal, grounding, scoring Python dengan breakdown, retrieval lokal, dan demo HTML. Jalur live membutuhkan API key dan model/kuota akun yang tersedia; verifikasi mocked tidak membuktikan akurasi model. Simulator, assistant, panduan darurat, dan voice menunggu spesifikasi terpisah.

Mulai dari [brief Fitur 01](docs/features/01-job-scam-recognition/BRIEF.md), [kontrak API beserta tiga contoh curl](docs/api/recognition.md), atau [rincian implementasi](docs/features/01-job-scam-recognition/IMPLEMENTATION.md).

## Ruang lingkup dan stack

AI Engineer menangani backend, orkestrasi/integrasi AI, scoring deterministik, retrieval, evaluasi, tes, dan kontrak API ketika spesifikasinya disetujui. Frontend produksi dikerjakan tim lain; `demo/` hanya membantu pengujian lokal.

Python 3.11+, FastAPI, Pydantic v2, Pydantic Settings, Uvicorn, HTTPX, python-multipart, Pillow, pytest, Ruff, standard logging berformat JSON, serta HTML/CSS/JavaScript tanpa framework. Dependency dikelola **hanya dengan uv**; versi hasil resolusi disimpan di `uv.lock`.

## Struktur proyek

```text
ai-feature/
├── 01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md
├── app/             # api/v1, core, schemas, services
├── data/            # examples fiktif dan knowledge/sources.json terkurasi
├── demo/            # satu halaman demo lokal
├── tests/           # tes tanpa koneksi provider
├── docs/            # indeks, arsitektur, kontrak, aturan, ADR, worklog
├── scripts/         # petunjuk penambahan utilitas bila diperlukan
├── .github/workflows/ci.yml
├── AGENTS.md
├── .env.example     # template yang boleh masuk Git
├── .env             # konfigurasi lokal; diabaikan Git
├── .gitignore
├── .python-version
├── pyproject.toml
├── uv.lock
└── CHANGELOG.md
```

## Prasyarat dan instalasi

Gunakan Python 3.11+ dan [uv](https://docs.astral.sh/uv/getting-started/installation/). `.python-version` memilih Python 3.11 sebagai baseline. Jalankan perintah dari folder `ai-feature/`.

```powershell
cd "C:\Local D\Galeri Belajar\Project Code\mit-week\ai-feature"
uv python install 3.11
uv sync --locked
```

Instalasi awal membutuhkan internet untuk dependency. Setelah environment tersedia, startup, health, demo, dan tes berjalan tanpa API key maupun jaringan eksternal. Analisis bermateri cukup memerlukan koneksi Gemini serta key/kuota yang sah; key kosong menghasilkan error 503 yang jujur. `uv sync` membuat `.venv`; aktivasi manual tidak diperlukan.

File `.env` lokal sudah disiapkan saat inisialisasi, dengan API key kosong. Pada checkout baru, salin template **hanya jika `.env` belum ada**:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Environment OS mengungguli `.env`. Lokasi `.env` ditentukan relatif terhadap root proyek. Tes mengabaikan file `.env` lokal dan membersihkan variabel aplikasi agar tidak bergantung pada kredensial pengembang.

## Menjalankan backend dan demo

```powershell
uv run --locked uvicorn app.main:create_app --factory --reload --reload-dir app --host 127.0.0.1 --port 8000 --no-access-log
```

- Health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Health versi API: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- OpenAPI: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)
- Demo: [http://127.0.0.1:8000/demo](http://127.0.0.1:8000/demo), isi teks dan/atau satu gambar, lalu klik **Analisis Lowongan**. Tombol **Periksa backend** tetap tersedia.

Buka demo melalui FastAPI, bukan dengan membuka `index.html` sebagai `file://`. Demo menggunakan origin backend yang sama sehingga tidak memerlukan server frontend tambahan. JSON dan `X-Request-ID` ditampilkan; error jaringan, HTTP, JSON, dan timeout ditangani. Swagger memakai aset CDN bawaan FastAPI; UI interaktifnya membutuhkan internet untuk memuat aset tersebut, sedangkan endpoint `/docs`, `/openapi.json`, demo, dan health tetap dilayani lokal.

Health sukses berbentuk `{"status":"ok","service":"Job Scam Guardian AI","version":"0.2.0"}`. Ini hanya liveness proses, bukan pemeriksaan provider AI. Detail ada di [kontrak API](docs/api/README.md).

Untuk analisis nyata, isi `GEMINI_API_KEY` di `.env`, pastikan `GEMINI_MODEL` tersedia untuk akun, lalu **restart server**. Model default dipilih dari [dokumentasi resmi Gemini](https://ai.google.dev/gemini-api/docs/models) saat implementasi dan dapat diganti melalui environment. Jangan mengirim key ke browser atau menaruhnya pada curl frontend. Sampel fiktif teks dan PNG tersedia di `data/examples/` untuk menguji tiga kombinasi input. Pengujian live akan memakai kuota akun dan mengirim materi ke Google Gemini.

## Konfigurasi environment

| Variabel | Default tanpa `.env` | Kegunaan |
|---|---|---|
| `APP_NAME` | `Job Scam Guardian AI` | Nama layanan pada OpenAPI, health, dan log |
| `APP_ENV` | `development` | `development`, `test`, atau `production` |
| `DEBUG` | `false` | Level log aplikasi DEBUG; tidak mengaktifkan traceback HTTP |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |
| `ALLOWED_ORIGINS` | kosong | Origin frontend dipisah koma; `.env.example` menyediakan localhost 3000/5173 |
| `GEMINI_API_KEY` | kosong | Wajib untuk analisis bermateri cukup; tetap opsional saat startup/health |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Model multimodal/structured-output yang tersedia pada akun |
| `GEMINI_TIMEOUT_SECONDS` | `45` | Timeout total provider, rentang 1–120 detik |
| `ELEVENLABS_API_KEY` | kosong | Disiapkan untuk voice opsional; belum dipakai |

Pada produksi gunakan `APP_ENV=production`, `DEBUG=false`, dan origin frontend HTTPS yang eksplisit. Wildcard origin ditolak; credentials CORS dinonaktifkan. CORS mengizinkan GET/POST serta header Content-Type dan X-Request-ID. CORS bukan autentikasi atau pembatas jaringan. Hilangkan `--reload` pada produksi. Pemilihan hosting dan hardening deployment dilakukan pada fase integrasi.

Jangan memasukkan API key ke JavaScript, fixture, dokumentasi, atau commit. `.env` diabaikan Git. Logger hanya mencatat metadata terpilih; input, query, header rahasia, dan pesan exception tidak direkam. `--no-access-log` menghindari log akses Uvicorn tambahan yang dapat memuat URL mentah; log request JSON aplikasi tetap aktif.

## Pengujian dan kualitas

```powershell
uv run --locked ruff format .
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest -q
```

Tes mencakup fondasi serta tiga modalitas Recognition, JSON provider, grounding/negasi, scoring, upload dalam memori, KB gating/fallback, error provider, dan log tanpa input/key. Transport HTTPX eksternal diblokir; provider dimock melalui MockTransport, bukan menampilkan inferensi nyata. CI menjalankan lockfile check, lint, format check, dan pytest pada Python 3.11 dan 3.13. CI cloud baru berjalan setelah proyek diunggah ke GitHub. Pemetaan acceptance criteria dan langkah live tersedia pada [test plan](docs/features/01-job-scam-recognition/TEST_PLAN.md).

Untuk uji rendering browser tanpa key, tersedia server **khusus tes berlabel MODE UJI MOCK**:

```powershell
uv run --locked uvicorn tests.demo_server:create_test_app --factory --host 127.0.0.1 --port 8001 --no-access-log
```

Buka `http://127.0.0.1:8001/demo`. Respons ekstraksi pada server ini adalah fixture; jangan memakai command tersebut untuk deployment atau mengklaimnya sebagai hasil Gemini. Demo biasa di port 8000 tetap memakai provider sebenarnya dan error jujur bila belum tersedia.

Dependency baru ditambahkan dengan `uv add nama-paket` atau `uv add --dev nama-paket`, lalu tinjau perubahan `pyproject.toml` dan `uv.lock`. Jangan membuat `requirements.txt` paralel. Folder ini adalah root backend; bila seluruh folder `mit-week` dijadikan satu Git repository, pindahkan workflow ke `.github/workflows/` root repository dan atur `working-directory: ai-feature`.

## Dokumentasi dan alur kerja

Mulai dari [AGENTS.md](AGENTS.md), [indeks dokumentasi](docs/INDEX.md), dan [document router](docs/engineering/DOCUMENT_ROUTER.md). Siklus perubahan: READ → PLAN → IMPLEMENT → VERIFY → DOCUMENT → LOG → REPORT. Perubahan arsitektur penting mendapat ADR; kontrak API dan tes diperbarui bersama implementasi. Hasil kerja dicatat di [worklog](docs/logs/WORKLOG.md); perubahan penting diringkas di [changelog](CHANGELOG.md).

Langkah berikutnya: verifikasi live dengan key/kuota yang sah, evaluasi pembacaan gambar serta kasus normal/berisiko/ambigu, dan serahkan [kontrak frontend](docs/api/recognition.md) ke tim frontend produksi. Bobot belum dikalibrasi, OCR belum independen, dan kurasi hukum masih terbatas; cakupan sumber serta kandidat pending dijelaskan pada [README KB](data/knowledge/README.md). Review kedua entri aktif paling lambat 31 Januari 2027. Tidak ada klaim akurasi, verifikasi perusahaan, atau putusan pelanggaran hukum.
