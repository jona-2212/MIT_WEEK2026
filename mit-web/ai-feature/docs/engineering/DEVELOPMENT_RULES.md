# Development rules

Tujuan: menetapkan konvensi engineering untuk backend yang ringan, dapat dipelihara, dan dapat ditelusuri. Gunakan bersama [AGENTS.md](../../AGENTS.md) dan [document router](DOCUMENT_ROUTER.md).

## Kode dan dependency

- Python 3.11+; type hint pada antarmuka fungsi. Gunakan nama Inggris yang jelas dan fungsi kecil sesuai tanggung jawabnya.
- Route menangani HTTP, services menangani logika bisnis/orchestrasi, schema memvalidasi kontrak, core menangani konfigurasi dan infrastruktur bersama. Ikuti [system overview](../architecture/SYSTEM_OVERVIEW.md).
- Jangan membuat folder/provider abstraction sebelum diperlukan spesifikasi yang disetujui. Services Recognition saat ini mengikuti [spesifikasi Fitur 01](../features/01-job-scam-recognition/BRIEF.md); fitur lain tetap menunggu spesifikasi.
- Gunakan `uv add` dan `uv add --dev`; tinjau serta sertakan `uv.lock`. Hindari dependency manager paralel dan dependency infrastruktur besar tanpa alasan terukur.
- Jangan mengubah blueprint atau file lain yang tidak terkait tanpa kebutuhan tugas.

## Konfigurasi dan HTTP

- Baca environment lewat `Settings`; jangan membaca API key tersebar di route. API key memakai `SecretStr` dan hanya dipakai adaptor provider saat analisis, bukan untuk request startup/health.
- Default aman: DEBUG false, origin CORS kosong, tanpa request provider saat startup. `.env.example` mengizinkan origin lokal secara eksplisit; produksi menggunakan environment OS dan DEBUG false.
- Semua fitur API berikutnya menggunakan `/api/v1`. `/health` tetap tersedia untuk probe proses.
- HTTP error terduga menggunakan `HTTPException`; validasi menggunakan Pydantic. Handler pusat mengembalikan envelope aman. Jangan mengirim detail exception, traceback, input validasi mentah, atau respons provider utuh ke klien.
- Pertahankan `X-Request-ID` yang berupa UUID; ID tidak valid diganti. Services membaca `request_id_context` untuk korelasi. ID hanyalah korelasi, bukan identitas pengguna atau otorisasi.
- Tambahkan method/header CORS hanya saat kontrak benar-benar memerlukan. CORS tidak melindungi endpoint dari klien non-browser.

## Logging dan data sensitif

Logger aplikasi berada pada namespace `job_scam_guardian.*`. Event memakai nama stabil seperti `application_started`, `application_stopped`, `http_request_completed`, dan `http_request_failed`. Output JSON dikirim ke stdout; timestamp ISO 8601 UTC. Field dasar: `timestamp`, `log_level`, `event`, `request_id`, `service`; request menambah `component`, `method`, `path`, `status_code`, `duration_ms`, `success`.

`path` merupakan template route, sedangkan route tidak dikenal memakai `<unmatched>`; jangan gunakan URL mentah atau query. `success` pada log HTTP berarti status di bawah 500, bukan jaminan keberhasilan bisnis. ID berasal dari ContextVar yang dipulihkan setelah request untuk mencegah kebocoran antar-request konkuren.

Gunakan pesan event konstan dan metadata yang disetujui, bukan interpolasi input. Formatter hanya menyalin daftar field yang diizinkan dan mengabaikan traceback. Ini **bukan** penyaring PII universal: agen tetap bertanggung jawab atas nilai `event` dan metadata yang dicatat. Jangan memakai `logger.exception()` dengan data input atau `print(settings)`.

Jangan mencatat API key, authorization header, password, OTP, KTP/identifier pribadi, screenshot/audio mentah, prompt lengkap, atau respons AI lengkap. Error default hanya mencatat kategori seperti `RuntimeError`; penyelidikan tambahan harus tetap disanitasi. Gunakan `--no-access-log` sesuai README agar Uvicorn tidak menambah log URL mentah. Log lifecycle Uvicorn sendiri tetap menggunakan format bawaan; JSON terstruktur berlaku pada logger aplikasi.

Recognition menggunakan event `ai_request_completed` / `ai_request_failed`; integrasi AI berikutnya mengikuti metadata yang sama bila tersedia:

| Field | Isi |
|---|---|
| `provider`, `model` | Identifier provider/model yang sudah dikonfigurasi, bukan input pengguna |
| `request_id` | Korelasi ContextVar request saat ini |
| `prompt_template_version` | Versi template prompt, tanpa isi prompt |
| `latency_ms` | Durasi panggilan provider |
| `input_tokens`, `output_tokens` | Jumlah token terlapor; jangan mengarang bila tidak tersedia |
| `success` | Boolean hasil panggilan |
| `error_category` | Kategori tersanitasi, misalnya `provider_timeout` atau `invalid_provider_response` |

Field yang belum diketahui dihilangkan. Adaptor Recognition menerapkan konvensi ini untuk provider, model, template, latency, hasil, token yang terlapor pada respons valid, dan kategori error. Tidak ada telemetry pihak ketiga atau penyimpanan input default.

## Quality gate dan dokumentasi

Jalankan perintah kualitas pada [README](../../README.md). Tes harus deterministik, memakai data sintetis, dan tidak bergantung pada API key atau layanan eksternal. Tes asinkron menggunakan HTTPX ASGITransport dengan lifespan yang dijalankan eksplisit; plugin AnyIO tersedia melalui dependency framework. Tambahkan tes bermakna untuk perubahan perilaku, kontrak, privasi, dan jalur gagal. Jangan mengulang tes hanya untuk menambah jumlah.

Catat perintah dan hasil sebenarnya pada [worklog](../logs/WORKLOG.md), lalu perbarui kontrak, arsitektur, ADR, dan changelog sesuai router. CI harus menjalankan lint, format check, lockfile check, dan tes. Bedakan hasil lokal dengan CI cloud yang benar-benar sudah berjalan.
