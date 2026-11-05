# System overview

Tujuan: menjelaskan arsitektur **yang sudah diimplementasikan** sampai Recognition 0.2.0. Konteks produk tetap berada pada [Product Blueprint](<../../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>); kebutuhan Fitur 01 pada [BRIEF](../features/01-job-scam-recognition/BRIEF.md).

```text
Demo HTML/JS (origin yang sama)      Frontend tim lain (origin eksplisit)
                  \                    /
                      HTTP/JSON
                          |
               FastAPI application factory
                          |
            Request context + log durasi/hasil
                          |
                 CORS origin eksplisit
                          |
                Safe error boundary
                          |
             HTTP/validation error handlers
                          |
             /health, /api/v1/health       POST /api/v1/analyze
                     |                           |
             HealthResponse             Body/multipart dalam memori
                                                 |
                                       Decode/normalisasi gambar
                                                 |
                                       Gemini: satu ekstraksi kasus
                                                 |
                                       Pydantic + evidence grounding
                                                 |
                                       Scoring Python + breakdown
                                                 |
                                       Retrieval KB lokal terkurasi
                                                 |
                                       AnalysisResponse (Pydantic)

        Settings (.env / environment) + JSON stdout logging
```

## Batas modul

| Lokasi | Tanggung jawab saat ini |
|---|---|
| `app/main.py` | `create_app()`, lifecycle HTTPX client/service, middleware, router, dan demo |
| `app/api/v1/health.py` | Route liveness dengan kontrak yang sama pada kedua path |
| `app/schemas/` | Health, input/ekstraksi/hasil Recognition, metadata KB, dan envelope error |
| `app/core/config.py` | Pydantic Settings, origin CORS, SecretStr, validasi environment |
| `app/core/logging.py` | Formatter JSON, allowlist metadata, ContextVar request ID |
| `app/core/middleware.py` | Korelasi request dan log; batas aman exception sebelum CORS |
| `app/core/errors.py` | Respons error pusat yang menyembunyikan detail/input |
| `app/services/recognition.py` | Orkestrasi satu kasus dan penyusunan hasil/rekomendasi |
| `app/services/ai/` | Prompt versi dan adaptor REST Gemini dengan timeout/output terstruktur |
| `app/services/risk/` | Grounding, negasi terbatas, dan scoring deterministik/deduplikasi |
| `app/services/knowledge/` | Loader dan retrieval dengan gating metadata/verification/expiry |
| `app/services/uploads.py` | Batas body, multipart tanpa disk, validasi/normalisasi gambar |
| `data/` | Contoh fiktif dan metadata KB lokal; tidak menyimpan raw input pengguna |
| `demo/` | HTML/CSS/JS lokal, tanpa framework/dependency eksternal |
| `tests/` | Fondasi dan pipeline Recognition memakai provider MockTransport; server browser test diberi label mock |

## Lifecycle dan request

Uvicorn memanggil `app.main:create_app` melalui `--factory`. Factory memuat Settings dan menyiapkan logger aplikasi secara idempoten. Lifespan menyiapkan HTTPX client serta RecognitionService dan menutup client saat shutdown. Startup/health tidak mengirim request eksternal atau memeriksa provider. Request analisis yang cukup dan valid memanggil satu provider Gemini dengan key dari environment; key kosong memberi 503.

Middleware murni ASGI menghindari pemutusan propagasi ContextVar. Request ID UUID yang valid diteruskan dalam bentuk kanonik; jika tidak tersedia/tidak valid, dibuat UUID v4. ID masuk ke request state, ContextVar, response header, dan envelope error. Setelah request, konteks dikembalikan ke nilai sebelumnya.

Template path log diperoleh dari konteks route terdaftar FastAPI agar prefix `/api/v1` dan endpoint dokumentasi tercatat lengkap. Nilai parameter dan query tidak disalin ke log; URL yang tidak cocok dengan route hanya dicatat sebagai `<unmatched>`.

Urutan middleware pengguna: request context → CORS → safe error boundary → penanganan exception HTTP/validasi bawaan framework → route. Batas error berada di dalam CORS agar respons 500 endpoint tetap memiliki header CORS yang benar. Lapisan request berada di luar CORS agar preflight juga memiliki ID dan log. Infrastruktur ServerErrorMiddleware FastAPI tetap menjadi lapisan luar bawaan untuk kegagalan framework/middleware; fondasi tidak menambah fitur streaming atau background job.

Exception endpoint yang tidak terduga dikonversi menjadi JSON 500 aman. Request validation tidak menggemakan `input`; HTTP error tidak menggemakan detail mentah. Pesan/kategori error dan ID dijelaskan di [kontrak API](../api/README.md). Bila respons sudah dikirim, seperti pada streaming/background task mendatang, status/body tidak dapat diganti; jalur tersebut perlu desain dan tes tambahan saat diperlukan.

## Konfigurasi, observabilitas, dan batas fondasi

`.env` relatif terhadap root proyek; environment OS menang. API key hanya wajib untuk analisis bermateri cukup. DEBUG tidak mengaktifkan traceback HTTP, dan ditolak pada produksi. Origin default tanpa `.env` kosong; daftar lokal pada template harus diganti sesuai deployment. CORS mengizinkan GET/POST. Tidak ada autentikasi, database, task queue, penyimpanan pengguna, atau telemetry eksternal.

Upload dibatasi sebelum parser; spool tidak melakukan rollover ke disk. Gambar yang valid dibersihkan metadatanya dalam thread pool. Teks/gambar/transkripsi hanya dipakai dalam memori untuk request tersebut. Provider menerima konten yang dikirim pengguna; penyamaran data pada piksel/teks tetap tanggung jawab pengguna. Pembacaan gambar bergantung pada transkripsi model yang sama, belum OCR independen.

Aturan dan ambang skor adalah heuristik versi `rules-v1`. Hukum/panduan berasal dari KB lokal terkurasi dan tidak memengaruhi skor. Schema/data flow, batas byte/piksel, kecukupan materi, timeout, serta fallback dijelaskan pada [implementasi Recognition](../features/01-job-scam-recognition/IMPLEMENTATION.md); kontraknya pada [API Recognition](../api/recognition.md).

Log JSON aplikasi hanya memuat metadata aman dan template route. Kebijakan serta field integrasi AI mendatang ada di [development rules](../engineering/DEVELOPMENT_RULES.md); output ini tidak membuktikan akurasi AI maupun kesehatan provider.

Dasar keputusan: [ADR-0001](../decisions/ADR-0001-project-foundation.md) dan [ADR-0002](../decisions/ADR-0002-recognition-pipeline.md). Perubahan selanjutnya mengikuti [document router](../engineering/DOCUMENT_ROUTER.md).
