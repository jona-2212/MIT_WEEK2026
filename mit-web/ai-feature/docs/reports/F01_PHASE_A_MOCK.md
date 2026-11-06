# Laporan Checkpoint 2 — Fitur 01 Fase A

Tanggal: 5 November 2026. Branch: `sync/upstream-dev-20261105`, baseline merge `571731a`.
Status: implementasi backend/demo/RAG terintegrasi dan lolos pengujian MOCK.
Embedding/inferensi Gemini live serta deployment belum dijalankan karena belum diotorisasi.

## Hasil yang benar-benar bekerja

- POST /api/v1/analyze memproses teks, PNG/JPEG/WebP atau gabungan; body/file/piksel,
  MIME, multipart terputus/duplikat dan total raw multipart divalidasi.
- recognition-v2 memisahkan fraud_assessment dan legal_screening; tidak ada skor/bobot.
  Grounding/negasi/deduplikasi dan konflik kategori memprioritaskan insufficient_data.
- PDF fixture → parser → halaman/pasal/chunk → embedding MOCK → JSON → Chroma lokal →
  ekspor JSON tervalidasi → retrieval → response API → demo HTML telah diuji.
- Registry/provenance, checksum, model/dimensi, pasal/halaman/seleksi, expiry, top-k dan
  ambang configurable diperiksa. Runtime membuka file hanya untuk read; Chroma/pypdf
  tidak diimpor application factory.
- Indeks/embedding gagal mempertahankan fraud yang valid tanpa referensi hukum palsu.
  PDF/retrieval tidak dieksekusi sebagai instruksi. Tidak ada public PDF ingestion.
- Demo menampilkan hasil backend, bukti, legal/missing facts, raw JSON/error, request ID,
  serta label MODE UJI MOCK. Tidak menampilkan hasil simulasi pada server biasa.

## Quality gate aktual

Semua perintah dari root layanan, memakai uv/lock yang sama:

| Perintah | Hasil |
|---|---|
| `uv sync --locked` | PASS; 97 entri resolusi, 93 package terpasang diaudit sinkronisasi, bukan audit keamanan |
| `uv run --locked ruff check .` | PASS — All checks passed |
| `uv run --locked ruff format --check .` | PASS — 79 files already formatted |
| `uv run --locked pytest -q` | **196 passed in 20.21s**, tanpa warning |
| Build MOCK + Chroma + export lewat CLI | PASS; 3 record fixture tersimpan dan ekspor verified |
| `verify_legal_index.py --allow-test-fixture` | PASS; hash/metadata/vektor sesuai |
| `build_legal_index.py --plan` pada pilot owner | PASS; 1 sumber, 1 chunk halaman 7, 0 API call |
| Import app.main | chromadb=False, pypdf=False dalam sys.modules |
| `git diff --check` | PASS; warning konversi LF/CRLF Git, bukan error whitespace |
| Tautan dokumentasi yang diubah | PASS; 15 Markdown, tidak ada target lokal hilang |

Pemeriksaan meliputi negasi (termasuk “tidak memungut biaya”/“tidak pernah meminta OTP”),
kutipan rekaan, state/kategori konflik, data minim, screenshot, provider missing key,
timeout/rate limit/malformed output, prompt injection, URL tidak di-fetch, sumber
pending/expired, PDF scan/rusak/terenkripsi/batas ukuran, anchor/seleksi pasal, query
relevan/tidak relevan, pengecualian, checksum/count/identitas korup, NaN/zero/dimensi,
model mismatch, deduplikasi/top-k/ambang, runtime read-only, serta roundtrip Chroma.

Asyncio Windows tertahan pada sandbox, lalu suite/builder/mock server dijalankan
dengan izin eksekusi lokal di luar sandbox. Transport provider dalam suite tetap
diblokir/dimock. Launcher pytest lokal yang berasal dari environment lama diregenerasi
melalui uv reinstall package yang sama; tidak ada perubahan versi tes karena perbaikan
launcher. Uji pertama menemukan asumsi fixture chunk duplikat; fixture diperbaiki.
Semua hasil final di atas berasal dari eksekusi sesudah perbaikan.

## Smoke HTTP dan browser

Server MOCK port 8001:
- /health, /api/v1/health, /docs, /demo, /openapi.json: HTTP 200 dengan request ID.
- Teks, screenshot, gabungan: HTTP 200, input_mode sesuai, fraud high,
  legal needs_more_context, satu referensi fixture berlabel.
- Materi biasa dengan negasi: low, tanpa klaim terverifikasi aman dan tanpa rujukan paksa.
- Respons contoh aktual: [recognition-mock.json](../examples/recognition-mock.json),
  request ID `66f30281-d8e3-4fb6-9dfa-e48db972f808`. **MOCK, bukan Gemini live.**

Browser memverifikasi input kosong, hasil high/low/insufficient_data, reset, raw JSON,
request ID dan form kembali bisa dipakai. Viewport mobile 390×844 tidak memiliki overflow
horizontal (lebar konten/viewport efektif sama, 375 px setelah scrollbar). Console demo
MOCK tidak menunjukkan error/warning JavaScript. Bukti:
[tampilan penuh](assets/demo-mock.jpg), [mobile](assets/demo-mock-mobile.jpg).

Server terpisah pada port 8130 memakai Settings(_env_file=None, gemini_api_key=None):
materi cukup memberi HTTP 503 provider_not_configured, UI menampilkan code/message/ID
dan JSON error jujur; retry tetap enabled. Server uji ini dihentikan. Server MOCK 8001
disediakan untuk owner, tidak di-deploy publik.

Sesudah perbaikan backend terakhir, server MOCK dijalankan ulang dengan kode final;
GET health dan POST analyze kembali HTTP 200, high + needs_more_context + satu referensi
fixture. Penghentian server uji 8130 dikonfirmasi lewat koneksi localhost yang ditolak.

## Build indeks dan Chroma

| Artefak | Status / ukuran |
|---|---|
| Fixture CC0 | 1 sumber sintetis, 2 halaman, 3 chunk, 768 dimensi |
| Model fixture | mock-embedding-v1; vektor kosakata deterministik, bukan model semantik |
| Tiga JSON fixture | **11.998 byte** |
| SHA-256 indeks fixture | `e06f1b74679b23194f52db7317670071cdaf0a6fb96d689e559aa13413e855ea` |
| Chroma smoke | koleksi jeli-legal-mock-e06f1b74679b2319, 3 record, 0 API call |
| Chroma resmi lokal | data/chroma_local/, koleksi jeli-legal-official, **0 record**, menunggu izin embedding |
| Bundle resmi runtime | belum dibuat; legal_screening=reference_unavailable pada server biasa |

Build dengan input/vektor sama diuji idempotent. API live tidak dijamin menghasilkan
byte vektor sama pada waktu berbeda. Ekspor Chroma menormalisasi representasi float32
dan menghitung ulang checksum sebelum verify. Tidak ada reset/delete koleksi existing.

## Pilot owner — satu PDF

Dipilih hanya `data/knowledge/pdf/2024pmnaker018.pdf`, 858.038 byte, 74 halaman.
PDF lain di folder owner tidak masuk manifest atau koleksi pilot.

SHA-256 `0584ae9d0b210b119e52e1a30a06e51dd9b394eb941d43a1ff22a58e37b35b56`
cocok byte-per-byte dengan [PDF resmi](https://jdih.kemnaker.go.id/asset/data_puu/2024pmnaker018.pdf).
[Metadata JDIH](https://jdih.kemnaker.go.id/peraturan/detail/2622/peraturan-menteri-nomor-18-tahun-2024)
menampilkan Berlaku saat diperiksa. Sumber existing ini dikurasi ulang; kandidat pending
lain tidak diaktifkan.

Manifest memilih **Pasal 11 halaman PDF 7**, termasuk ayat pengecualian: **1 sumber,
1 chunk, 1 request embedding dokumen direncanakan**. Status/jenis pelaksana PPTKS dan
pengecualian pada kasus pengguna tetap belum diverifikasi, sehingga bukan vonis hukum.
[Manifest](../../data/knowledge/legal_documents.json) dan
[provenance](../../data/knowledge/pilot_provenance.json) mencatat fakta pemeriksaan.
Pemeriksaan penggunaan teks norma merujuk
[UU 28/2014 Pasal 42 huruf b](https://jdihn.go.id/files/4/2014uu028.pdf), bukan aset desain situs.

## Kuota, kesiapan Vercel, dan batas

- Inferensi Gemini live: **NOT RUN — menunggu izin kuota terpisah**.
- Embedding Gemini live: **NOT RUN — owner memilih menunggu izin**. Tidak ada biaya/kuota
  API AI yang digunakan pekerjaan ini; ketersediaan key/model akun belum dibuktikan.
- Chroma Cloud: tidak diimplementasikan. Chroma lokal tidak memerlukan hosting vector DB
  cloud; Gemini/embedding dan hosting aplikasi tetap mungkin berbiaya.
- Pilot nanti memerlukan satu embedContent dokumen; masing-masing analisis dengan RAG aktif
  dapat menambah satu embedContent query selain satu generateContent, tanpa retry otomatis.
- Rubrik dan cosine 0,75 adalah heuristik/parameter eksperimen, bukan validasi ilmiah.
  Mock/SDK passing tidak membuktikan ketahanan atau kualitas inferensi model live.
- Entrypoint Vercel diuji lokal tanpa key; profil 4 MiB file dan **4.259.840 byte total
  multipart** diberlakukan pada Content-Length maupun stream. Indeks runtime hanya read.
- Snapshot dependency produksi Windows: 21 distribusi, **27.688.571 byte**; Chroma dan
  pypdf bukan dependency runtime. Ini bukan ukuran bundle Linux/Vercel.
- Build/deployment Vercel, ukuran bundle akhir, CI cloud/Python 3.13, OCR independen,
  kalibrasi relevance, redaksi PII otomatis dan rate limiting publik belum diuji/diimplementasikan.
- Tidak ada reset, commit, push, merge, deployment, atau perubahan kode React/backend lama.
  Perubahan frontend dan pengarsipan dokumen yang telah ada sebelum implementasi dipertahankan.

## Menjalankan dan melanjutkan

```powershell
uv sync --locked
uv run --locked python -m uvicorn tests.demo_server:create_test_app --factory --host 127.0.0.1 --port 8001 --no-access-log
```

Demo: [http://127.0.0.1:8001/demo](http://127.0.0.1:8001/demo), berlabel MOCK.
Jangan menjalankan ulang bila proses demo yang disediakan masih memakai port ini.

Input berikutnya: konfigurasi backend `.env` (GEMINI_API_KEY, model/dimensi yang tersedia)
dan **izin kuota** sebelum embedding/analisis live. Manifest/PDF pilot sudah disiapkan.
Perintah live yang membutuhkan persetujuan dan proses rebuild/redeploy ada di
[runbook](../engineering/LEGAL_INDEX_RUNBOOK.md). Tidak ada kebutuhan upload PDF lewat web.

## File pekerjaan ini

Daftar berikut hanya perubahan Fitur 01 oleh agent; tidak memasukkan perubahan frontend,
penghapusan/pemindahan brief, atau SRS yang telah disediakan owner.

- Diperbarui: [.env.example](../../.env.example)
- Diperbarui: [.gitignore](../../.gitignore)
- Diperbarui: [AGENTS.md](../../AGENTS.md)
- Diperbarui: [CHANGELOG.md](../../CHANGELOG.md)
- Diperbarui: [README.md](../../README.md)
- Diperbarui: [app/__init__.py](../../app/__init__.py)
- Diperbarui: [app/api/v1/analyze.py](../../app/api/v1/analyze.py)
- Diperbarui: [app/core/config.py](../../app/core/config.py)
- Diperbarui: [app/main.py](../../app/main.py)
- Diperbarui: [app/schemas/knowledge.py](../../app/schemas/knowledge.py)
- Diperbarui: [app/schemas/recognition.py](../../app/schemas/recognition.py)
- Diperbarui: [app/services/ai/gemini.py](../../app/services/ai/gemini.py)
- Diperbarui: [app/services/knowledge/retrieval.py](../../app/services/knowledge/retrieval.py)
- Diperbarui: [app/services/recognition.py](../../app/services/recognition.py)
- Diperbarui: [app/services/risk/grounding.py](../../app/services/risk/grounding.py)
- Diperbarui: [app/services/risk/scoring.py](../../app/services/risk/scoring.py)
- Diperbarui: [app/services/uploads.py](../../app/services/uploads.py)
- Diperbarui: [data/examples/recognition.json](../../data/examples/recognition.json)
- Diperbarui: [data/knowledge/README.md](../../data/knowledge/README.md)
- Diperbarui: [data/knowledge/sources.json](../../data/knowledge/sources.json)
- Diperbarui: [demo/index.html](../../demo/index.html)
- Diperbarui: [docs/INDEX.md](../../docs/INDEX.md)
- Diperbarui: [docs/api/README.md](../../docs/api/README.md)
- Diperbarui: [docs/api/recognition.md](../../docs/api/recognition.md)
- Diperbarui: [docs/architecture/SYSTEM_OVERVIEW.md](../../docs/architecture/SYSTEM_OVERVIEW.md)
- Diperbarui: [docs/engineering/DOCUMENT_ROUTER.md](../../docs/engineering/DOCUMENT_ROUTER.md)
- Diperbarui: [pyproject.toml](../../pyproject.toml)
- Diperbarui: [scripts/README.md](../../scripts/README.md)
- Diperbarui: [tests/conftest.py](../../tests/conftest.py)
- Diperbarui: [tests/demo_server.py](../../tests/demo_server.py)
- Diperbarui: [tests/factories.py](../../tests/factories.py)
- Diperbarui: [tests/test_config.py](../../tests/test_config.py)
- Diperbarui: [tests/test_gemini.py](../../tests/test_gemini.py)
- Diperbarui: [tests/test_knowledge.py](../../tests/test_knowledge.py)
- Diperbarui: [tests/test_recognition.py](../../tests/test_recognition.py)
- Diperbarui: [tests/test_scoring.py](../../tests/test_scoring.py)
- Diperbarui: [uv.lock](../../uv.lock)
- Baru: [app/services/ai/embeddings.py](../../app/services/ai/embeddings.py)
- Baru: [app/services/ai/prompts/recognition-v2.txt](../../app/services/ai/prompts/recognition-v2.txt)
- Baru: [app/services/knowledge/chroma_store.py](../../app/services/knowledge/chroma_store.py)
- Baru: [app/services/knowledge/indexing.py](../../app/services/knowledge/indexing.py)
- Baru: [app/services/knowledge/static_index.py](../../app/services/knowledge/static_index.py)
- Baru: [data/knowledge/legal_documents.json](../../data/knowledge/legal_documents.json)
- Baru: [data/knowledge/pdf/README.md](../../data/knowledge/pdf/README.md)
- Baru: [data/knowledge/pdf_inventory.json](../../data/knowledge/pdf_inventory.json)
- Baru: [data/knowledge/pilot_provenance.json](../../data/knowledge/pilot_provenance.json)
- Baru: [data/legal_index/README.md](../../data/legal_index/README.md)
- Baru: [docs/decisions/ADR-0003-qualitative-static-rag.md](../../docs/decisions/ADR-0003-qualitative-static-rag.md)
- Baru: [docs/engineering/LEGAL_INDEX_RUNBOOK.md](../../docs/engineering/LEGAL_INDEX_RUNBOOK.md)
- Baru: [docs/examples/recognition-mock.json](../../docs/examples/recognition-mock.json)
- Baru: [docs/reports/F01_PHASE_A_MOCK.md](../../docs/reports/F01_PHASE_A_MOCK.md)
- Baru: [docs/reports/assets/demo-mock-mobile.jpg](../../docs/reports/assets/demo-mock-mobile.jpg)
- Baru: [docs/reports/assets/demo-mock.jpg](../../docs/reports/assets/demo-mock.jpg)
- Baru: [index.py](../../index.py)
- Baru: [scripts/build_legal_index.py](../../scripts/build_legal_index.py)
- Baru: [scripts/inspect_legal_pdfs.py](../../scripts/inspect_legal_pdfs.py)
- Baru: [scripts/manage_legal_chroma.py](../../scripts/manage_legal_chroma.py)
- Baru: [scripts/verify_legal_index.py](../../scripts/verify_legal_index.py)
- Baru: [tests/fixtures/legal_documents.json](../../tests/fixtures/legal_documents.json)
- Baru: [tests/fixtures/legal_index/chunks.json](../../tests/fixtures/legal_index/chunks.json)
- Baru: [tests/fixtures/legal_index/manifest.json](../../tests/fixtures/legal_index/manifest.json)
- Baru: [tests/fixtures/legal_index/vectors.json](../../tests/fixtures/legal_index/vectors.json)
- Baru: [tests/fixtures/legal_sources.json](../../tests/fixtures/legal_sources.json)
- Baru: [tests/fixtures/synthetic-cc0.pdf](../../tests/fixtures/synthetic-cc0.pdf)
- Baru: [tests/legal_fixtures.py](../../tests/legal_fixtures.py)
- Baru: [tests/test_chroma_store.py](../../tests/test_chroma_store.py)
- Baru: [tests/test_embeddings.py](../../tests/test_embeddings.py)
- Baru: [tests/test_legal_index.py](../../tests/test_legal_index.py)
- Baru: [tests/test_pilot_plan.py](../../tests/test_pilot_plan.py)
- Baru: [tests/test_vercel_entrypoint.py](../../tests/test_vercel_entrypoint.py)
- Baru: [vercel.json](../../vercel.json)

Worklog lokal di docs/logs/WORKLOG.md juga diperbarui; folder logs sudah diabaikan oleh
aturan Git repository sebelumnya. Tidak dilakukan force-add atau commit.
