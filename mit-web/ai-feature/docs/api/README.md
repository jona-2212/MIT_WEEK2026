# Kontrak API backend

Tujuan: menjelaskan kontrak HTTP yang tersedia untuk frontend dan pengujian. OpenAPI hasil kode tersedia di `/openapi.json`, Swagger di `/docs`. Terkait: [arsitektur](../architecture/SYSTEM_OVERVIEW.md) dan [panduan menjalankan](../../README.md).

## Endpoint tersedia

| Method | Path | Respons / kegunaan |
|---|---|---|
| GET | `/health` | 200 JSON, liveness proses untuk probe |
| GET | `/api/v1/health` | 200 JSON yang sama; pola versi bagi fitur berikutnya |
| POST | `/api/v1/analyze` | [Recognition multipart](recognition.md), teks/gambar/gabungan satu kasus |
| GET | `/docs` | 200 HTML Swagger bawaan FastAPI |
| GET | `/openapi.json` | 200 JSON OpenAPI yang dihasilkan schema |
| GET | `/demo` | 200 HTML demo Recognition dan health, tidak ditampilkan dalam OpenAPI |

Health/dokumentasi/demo tidak membutuhkan key atau request provider. Analisis bermateri cukup membutuhkan key, kuota, dan koneksi Gemini yang sah; lihat [kontrak Recognition](recognition.md). Swagger memuat aset CDN bawaan; jaringan diperlukan untuk aset UI interaktif, bukan untuk health, HTML demo, atau pembuatan OpenAPI.

## Health response

```json
{
  "status": "ok",
  "service": "Job Scam Guardian AI",
  "version": "0.3.0"
}
```

`status` bernilai `ok` ketika endpoint berhasil dieksekusi. `service` mengikuti `APP_NAME`; `version` mengikuti versi aplikasi. Hanya menyatakan proses aktif; tidak menunjukkan kesiapan model, kuota, Gemini, ElevenLabs, atau dependensi lain yang belum diperiksa. Kedua endpoint menggunakan schema `HealthResponse` yang sama.

## Request ID dan CORS

Setiap respons HTTP yang melewati middleware request menyertakan `X-Request-ID`. Klien boleh mengirim UUID kanonik 36 karakter pada header tersebut; server meneruskan UUID valid yang dinormalisasi menjadi huruf kecil, atau menggantinya dengan UUID v4 jika tidak valid. Header ini tidak boleh diisi prompt/identifier pribadi dan bukan token keamanan.

`ALLOWED_ORIGINS` berupa daftar origin HTTP(S) dipisahkan koma; wildcard ditolak. Header `X-Request-ID` diekspos kepada JavaScript pada origin yang diizinkan. CORS mengizinkan GET/POST serta header `Content-Type`/`X-Request-ID`, tanpa credentials. Browser dengan origin lain tidak menerima `Access-Control-Allow-Origin`; endpoint tetap dapat dipanggil klien non-browser. Preflight dilayani middleware, memiliki ID, dan dapat ditolak dengan HTTP 400 jika origin/method/header tidak diizinkan. Respons preflight bawaan Starlette berbentuk teks, bukan envelope error API.

## Error response

```json
{
  "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808",
  "error": {
    "code": "internal_error",
    "message": "Terjadi kesalahan pada server.",
    "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808"
  }
}
```

| Status | `error.code` | Makna |
|---|---|---|
| 404 | `http_error` | Endpoint tidak ditemukan |
| 405 | `http_error` | Method tidak diizinkan; header `Allow` dipertahankan |
| 422 | `validation_error` | Input request tidak valid; konvensi untuk endpoint dengan parameter/schema |
| 500 | `internal_error` | Kegagalan endpoint yang tidak terduga sebelum respons dikirim |

Status HTTP terduga lain menggunakan `http_error` dengan pesan generik aman. `request_id` pada body sesuai header. Jangan mengandalkan kalimat pesan sebagai identifier mesin; gunakan code/status. Tidak ada traceback, detail internal, body input, atau pesan provider dalam envelope. Endpoint health belum memiliki parameter wajib sehingga tidak memerlukan jalur validasi 422 dalam pemakaian normal.

Sejak 0.2.0, `request_id` di root ditambahkan tanpa menghapus `error.request_id` lama. Status/kode validasi dan provider untuk Recognition dijelaskan pada [kontrak fitur](recognition.md). Kontrak perubahan harus diperbarui bersama schema, OpenAPI, tes, dan catatan integrasi menurut [document router](../engineering/DOCUMENT_ROUTER.md).
