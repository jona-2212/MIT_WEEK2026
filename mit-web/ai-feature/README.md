# Jeli — Fitur 01 backend AI

Backend mandiri FastAPI untuk screening indikatif rekrutmen dari teks/screenshot. Versi 0.3.0 memakai kategori `high`, `medium`, `low`, atau `insufficient_data`, bukti kutipan, serta legal screening terpisah. Rubrik merupakan heuristik awal, belum tervalidasi ilmiah; `low` tidak berarti lowongan terverifikasi aman.

Acuan: [SRS v1.2](docs/features/SRS_Jeli_F01_Backend_AI_Standalone_v1.2.md), [API](docs/api/recognition.md), [ADR Fase A](docs/decisions/ADR-0003-qualitative-static-rag.md), [runbook PDF/Chroma](docs/engineering/LEGAL_INDEX_RUNBOOK.md), dan [panduan React serta Vercel](../README.md).

## Menjalankan demo sekarang — MODE UJI MOCK

Jalankan dari folder `mit-web/ai-feature/`:

```powershell
uv sync --locked
uv run --locked python -m uvicorn tests.demo_server:create_test_app --factory --host 127.0.0.1 --port 8001 --no-access-log
```

Buka [demo mock](http://127.0.0.1:8001/demo). Ekstraksi Gemini, embedding, serta PDF hukum pada mode ini adalah fixture sintetis, bukan hasil AI atau rujukan hukum nyata. Form tetap memanggil API FastAPI dan menjalankan validasi, grounding, kategori, retrieval JSON, serta rendering hasil/error. Sampel teks/gambar tersedia di `data/examples/`.

Fixture indeks sudah dibundel untuk tes. Perintah rebuild bila diperlukan:

```powershell
uv run --locked python -m tests.legal_fixtures
uv run --locked python scripts/build_legal_index.py --mock --manifest tests/fixtures/legal_documents.json --registry tests/fixtures/legal_sources.json --output tests/fixtures/legal_index
uv run --locked python scripts/verify_legal_index.py --index tests/fixtures/legal_index --registry tests/fixtures/legal_sources.json --allow-test-fixture
```

Server mock hanya untuk pengujian lokal dan tidak menjadi entrypoint deployment. Indeks fixture ditolak pada aplikasi non-test.

## Backend biasa

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
uv run --locked python -m uvicorn app.main:create_app --factory --reload --reload-dir app --host 127.0.0.1 --port 8000 --no-access-log
```

Tersedia `/health`, `/api/v1/health`, `/docs`, `/openapi.json`, `/demo`, dan `POST /api/v1/analyze`. Health adalah liveness, bukan bukti kesiapan Gemini/kuota/RAG. Swagger memakai aset CDN bawaan.

Startup/health/demo tidak memanggil API AI. Analisis bermateri cukup memakai Gemini; key kosong memberi 503 `provider_not_configured`. Tidak ada hasil simulasi pada server biasa. Indeks hukum resmi yang belum tersedia menghasilkan `legal_screening.status=reference_unavailable` sementara fraud yang berhasil tetap dikembalikan.

## Pilot PDF dan ChromaDB lokal

PDF pilot owner: `data/knowledge/pdf/2024pmnaker018.pdf`. Manifest memilih **Pasal 11, halaman PDF 7** dari dokumen 74 halaman, termasuk pengecualiannya. PDF lain tidak masuk manifest pilot. Checksum berkas owner cocok dengan PDF resmi JDIH; [catatan provenance](data/knowledge/pilot_provenance.json) dan [runbook](docs/engineering/LEGAL_INDEX_RUNBOOK.md) menjelaskan batas kurasi.

ChromaDB dipakai oleh tooling developer di `data/chroma_local/`. Runtime Vercel membaca tiga file JSON dari `data/legal_index/`. Bundle pilot resmi dibangun dengan satu embedding dokumen Gemini dan diekspor dari Chroma. Chroma dan pypdf berada di dependency dev.

```powershell
# Aman tanpa API AI: validasi PDF, seleksi pasal, dan estimasi request embedding
uv run --locked python scripts/build_legal_index.py --plan --manifest data/knowledge/legal_documents.json --output data/legal_index
# Membuat koleksi lokal kosong; tidak membuat embedding atau mengunduh model
uv run --locked python scripts/manage_legal_chroma.py init
```

Jalankan `--allow-embedding-api` untuk build berikutnya setelah mendapat persetujuan kuota. Ikuti [runbook PDF/Chroma](docs/engineering/LEGAL_INDEX_RUNBOOK.md) untuk validasi dan ekspor ulang.

## Konfigurasi

Key hanya di environment backend/`.env`, tidak di browser, source, fixture, log, atau commit. Environment OS mengungguli `.env`; restart server setelah perubahan. `.env` existing tidak ditimpa.

| Variabel | Default | Kegunaan |
|---|---|---|
| `GEMINI_API_KEY` | kosong | Analisis generatif dan embedding; startup tetap bekerja tanpa key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Model generatif; ketersediaan akun belum diuji live |
| `GEMINI_TIMEOUT_SECONDS` | 45 | Timeout generatif total, tanpa retry otomatis |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | Harus sama dengan model indeks |
| `EMBEDDING_DIMENSIONS` | 768 | Dimensi indeks/query yang sama |
| `EMBEDDING_TIMEOUT_SECONDS` | 15 | Timeout embedding |
| `LEGAL_INDEX_PATH` | `data/legal_index` | Bundle JSON read-only, relatif root layanan |
| `LEGAL_REGISTRY_PATH` | `data/knowledge/sources.json` | Registry kurasi |
| `LEGAL_TOP_K` | 3 | Batas hasil, 1–10 |
| `LEGAL_MIN_SIMILARITY` | 0.75 | Ambang cosine eksperimen, bukan ukuran kepastian hukum |
| `UPLOAD_PROFILE` | `local` | `local`: gambar 5 MiB; `vercel`: 4 MiB |
| `APP_ENV` | `development` | development/test/production; fixture hanya di test |
| `APP_NAME`, `LOG_LEVEL`, `DEBUG` | lihat template | Metadata layanan/log; DEBUG false pada produksi |
| `ALLOWED_ORIGINS` | kosong | Origin HTTP(S) eksplisit, dipisah koma; bukan autentikasi |
| `ELEVENLABS_API_KEY` | kosong | Belum digunakan |

Total multipart dibatasi **batas gambar + 64 KiB**, baik dari Content-Length maupun stream aktual. Profil Vercel: 4.259.840 byte total, di bawah 4,5 MB. Batas teks 12.000 karakter/48.000 byte, gambar 16 MP; MIME/decode, animasi, metadata, dan spool memori tetap diperiksa. Screenshot dibaca model yang sama, belum OCR independen. Samarkan data pribadi sebelum submit.

## Quality gate

```powershell
uv sync --locked
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest -q
```

Tes default memblokir transport API eksternal dan memakai fixture sintetis. Tes Chroma memakai SDK/database lokal dengan embedding yang sudah disediakan; tidak memakai default embedding model, API AI, atau telemetry eksternal. Tes pilot owner dilewati pada checkout yang tidak menyertakan PDF lokal.

[Hasil verifikasi](docs/reports/F01_PHASE_A_MOCK.md) membedakan mock, pilot parsing/provenance, Gemini live, embedding live, dan Vercel.

## Persiapan Vercel

`index.py` mengekspor factory dengan profil upload Vercel. Konfigurasi build memverifikasi indeks JSON resmi sebelum Vercel memaketkan fungsi. `vercel.json` mengecualikan PDF sumber, sampel, Chroma lokal, fixture, scripts, dokumen, cache, dan `.env`. Demo, prompt, registry, dan indeks JSON masuk ke bundle. Instalasi runtime memakai `uv sync --locked --no-dev`.

Tidak ada write persisten saat startup/request. Build indeks dilakukan offline dan perubahan PDF/registry/model memerlukan rebuild + redeploy. Entry point diuji lokal; build/deployment Vercel dan ukuran bundle akhirnya belum diuji. Tidak ada deployment, commit, atau push otomatis.

Keterbatasan: rubrik/ambang belum dikalibrasi, sumber pilot terbatas, transkripsi screenshot tidak independen, rate limiting publik dan redaksi PII otomatis belum diimplementasikan. Hasil mock tidak membuktikan kualitas inferensi atau akurasi model.
