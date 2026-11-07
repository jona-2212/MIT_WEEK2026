# ADR-0001 â€” Fondasi FastAPI modular dengan uv dan observabilitas lokal

- **Status:** Accepted untuk fase fondasi
- **Tanggal:** 2026-10-31

Tujuan: mencatat dasar arsitektur fondasi. Kebutuhan berasal dari permintaan inisialisasi dan [Product Blueprint](<../../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>), khususnya Fase B. Implementasi dijelaskan pada [system overview](../architecture/SYSTEM_OVERVIEW.md).

## Konteks

Tim membutuhkan backend AI ringan yang dapat diuji terpisah dari frontend produksi, ditelusuri, dan dijalankan tanpa kredensial. Repository awal hanya berisi blueprint; tidak ada kode atau spesifikasi fitur yang disetujui. Waktu pengembangan kompetisi terbatas, dan kebutuhan persistence/queue/retrieval belum dibuktikan.

## Keputusan

1. Jadikan `backend/` root proyek backend sambil mempertahankan file blueprint asli. Gunakan Python 3.11+ dan FastAPI dengan Pydantic v2 untuk route/schema tervalidasi serta dokumentasi OpenAPI otomatis.
2. Pisahkan API, schema, services, dan core secara sederhana. Services tetap kosong sampai spesifikasi fitur siap; tidak ada adaptor/provider atau engine spekulatif. Application factory memudahkan konfigurasi terisolasi dalam tes tanpa state aplikasi global saat import.
3. Gunakan uv sebagai satu pengelola dependency dan simpan `uv.lock`; `uv sync --locked` menolak ketidaksesuaian manifest/lock. Python 3.11 menjadi baseline; CI juga menargetkan 3.13. Dependency runtime terbatas pada FastAPI, Pydantic, Pydantic Settings, Uvicorn, dan HTTPX.
4. Gunakan Pydantic Settings, `.env` lokal yang diabaikan Git, SecretStr, DEBUG false, serta origin CORS eksplisit. Tidak ada API key wajib atau panggilan AI selama inisialisasi.
5. Gunakan standard logging JSON ke stdout dan middleware ASGI untuk UUID request, durasi, status, serta kategori error tersanitasi. Urutan request context â†’ CORS â†’ safe error boundary menjaga korelasi preflight dan header CORS pada kegagalan endpoint. Tidak mencatat pesan exception atau input pengguna.
6. Pertahankan health root dan `/api/v1/health`; health hanya memeriksa proses. Semua fitur mendatang mengikuti prefix `/api/v1`. Gunakan demo HTML/CSS/JS yang disajikan lewat FastAPI, tanpa framework frontend.
7. Terapkan pytest, Ruff, workflow GitHub Actions, AGENTS, document router, worklog, changelog, dan ADR. Tunda fitur produk sampai spesifikasi masing-masing ditinjau.

## Alternatif yang dipertimbangkan

- **Satu file monolitik:** cepat dibuat, tetapi akan mencampur HTTP, prompt/scoring, konfigurasi, dan log ketika fitur bertambah. Pemisahan package kecil memberi batas yang jelas tanpa membangun framework sendiri.
- **Django atau Flask:** dapat digunakan, tetapi FastAPI sudah dipilih blueprint dan sesuai kebutuhan schema/kontrak serta orkestrasi HTTP asinkron.
- **pip + requirements / Poetry:** bisa mengelola dependency, tetapi satu alur uv dengan lockfile memenuhi reproduksibilitas tanpa workflow paralel.
- **Frontend framework untuk demo:** menambah toolchain tanpa kebutuhan uji health; satu halaman same-origin memadai.
- **Database, LangChain/vector database, queue, telemetry eksternal:** belum ada kebutuhan fase fondasi yang membenarkan biaya operasionalnya.

## Konsekuensi

Proyek dapat dijalankan tanpa provider dan memiliki kontrak/korelasi yang teruji sebelum fitur AI dikembangkan. Batas modul serta dokumentasi memberi titik perluasan yang jelas. Tidak ada klaim deteksi scam, pemeriksaan hukum, atau kesehatan provider.

Dependency awal perlu diunduh; sesudah itu runtime fondasi/tes tidak memerlukan internet. UI Swagger memakai CDN bawaan, sehingga aset interaktif membutuhkan jaringan. Logger aplikasi JSON tidak mengubah format lifecycle Uvicorn; log akses Uvicorn dinonaktifkan melalui perintah menjalankan yang didokumentasikan. Streaming/background job, persistence, hardening deployment, rate limiting, serta provider timeout baru dirancang saat diperlukan. Workflow di folder ini diasumsikan berada pada root repository backend; monorepo membutuhkan penempatan workflow dan working-directory yang disesuaikan.

Referensi implementasi: [uv â€” locking dan syncing](https://docs.astral.sh/uv/concepts/projects/sync/), [uv â€” GitHub Actions](https://docs.astral.sh/uv/guides/integration/github/), [Starlette â€” middleware dan CORS](https://www.starlette.io/middleware/). Hasil verifikasi sebenarnya dicatat di [worklog](../logs/WORKLOG.md).

