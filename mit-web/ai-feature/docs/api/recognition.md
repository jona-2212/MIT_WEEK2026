# API Fitur 01 — Recognition

Tujuan: kontrak integrasi frontend untuk satu kasus rekrutmen. Acuan kebutuhan: [BRIEF](../features/01-job-scam-recognition/BRIEF.md), perilaku: [IMPLEMENTATION](../features/01-job-scam-recognition/IMPLEMENTATION.md), registry endpoint: [README API](README.md).

## Request

`POST /api/v1/analyze`, `Content-Type: multipart/form-data`. Header `X-Request-ID` opsional berupa UUID. Minimal satu input nonempty; tidak ada endpoint terpisah `/analyze/text` atau `/analyze/image` pada proyek ini.

| Field | Jenis | Aturan |
|---|---|---|
| `text` | string opsional | Whitespace tepi dipangkas; maksimal 12.000 karakter; field mentah maksimal 48.000 byte |
| `file` | binary opsional | Satu JPEG/PNG/WebP statis, maksimal 5 MiB dan 16 juta piksel; MIME harus sesuai decode aktual |

Form dengan field berulang/tidak dikenal, tipe field yang salah, atau boundary tidak lengkap ditolak. Total body maksimum 5 MiB + 64 KiB; ukuran dihitung juga pada stream tanpa Content-Length. Nama/ekstensi file tidak menentukan format. Teks + gambar digabung menjadi satu kasus dan satu request provider.

Contoh PowerShell dari root proyek; `curl.exe` dipakai agar tidak tertukar dengan alias PowerShell. Ubah path gambar sesuai berkas lokal. Materi contoh ini fiktif. Hapus data pribadi sebelum mengirim karena provider eksternal akan memproses input.

```powershell
# Teks saja
curl.exe -X POST http://127.0.0.1:8000/api/v1/analyze -F "text=Lowongan staf PT Contoh Fiktif. Transfer biaya administrasi Rp150.000 sebelum wawancara. Konfirmasi hari ini juga."

# Gambar saja
curl.exe -X POST http://127.0.0.1:8000/api/v1/analyze -F "file=@data/examples/suspicious-synthetic.png;type=image/png"

# Satu kasus gabungan
curl.exe -X POST http://127.0.0.1:8000/api/v1/analyze -F "text=Informasi dari perekrut fiktif: transfer biaya administrasi Rp150.000 sebelum wawancara." -F "file=@data/examples/suspicious-synthetic.png;type=image/png"
```

Pada JavaScript gunakan `FormData`, append hanya input yang diisi, lalu `fetch(..., {method:'POST', body: formData})`. **Jangan** menetapkan Content-Type multipart secara manual karena browser harus membuat boundary. Error dibaca dari JSON walau HTTP status bukan 200. Tampilkan `null` sebagai `—`, bukan 0. Lihat implementasi lengkap pada `demo/index.html` dan contoh request di Swagger `/docs`.

## Respons 200

| Field | Kontrak |
|---|---|
| `request_id` | UUID yang sama dengan header respons |
| `status` | `completed` atau `insufficient_data` |
| `input_mode` | `text`, `image`, atau `both` |
| `analysis_version` / `scoring_version` | `recognition-v1` / `rules-v1` |
| `risk_score` | Integer 0–100, atau null ketika data tidak cukup |
| `risk_level` | `low`, `medium`, `high`, atau `insufficient_data` |
| `score_breakdown` | `raw_score`, `final_score`, `contributions` dengan kode dan bobot unik |
| `summary` | Ringkasan berskop pada materi yang dikirim; bukan putusan keamanan |
| `indicators` | Enam kode, masing-masing `state`, bobot aturan, daftar evidence, dan `reason` |
| `unknowns` | Batas informasi/ketidakpastian, termasuk keterbatasan pembacaan gambar bila ada |
| `recommendations` | Tindakan verifikasi aman berdasarkan indikator |
| `legal_status` | `available` berarti ada konteks regulasi/panduan terverifikasi yang relevan; selain itu `not_available` |
| `legal_context` | Entri `source_id`, `type`, `title`, `article`, `official_url`, `summary`, `verified_at`, `exceptions` |
| `disclaimer` | Skor heuristik, bukan probabilitas, putusan hukum, atau jaminan keamanan |

Setiap indikator memiliki `code`, `state=detected/uncertain/not_detected`, `weight`, `evidence=[{source:text/image, quote}]`, dan `reason`. `weight` selalu bobot aturan; kontribusi 0 jika tidak detected atau tidak berbukti. UI sebaiknya menampilkan bobot **dan** kontribusi agar keduanya tidak tertukar.

Contoh perhitungan sintetis: upfront_payment 40 + urgency_pressure 15 → raw 55 → final 55 → high. Maksimum jumlah mentah 135 dibatasi menjadi 100. Pengulangan kutipan/kode pada kedua sumber tidak menambah bobot lagi. Versi aturan menandai heuristik yang dipakai; jangan menafsirkan 55 sebagai 55% peluang penipuan.

Untuk insufficient_data: `risk_score=null`, `risk_level=insufficient_data`, `score_breakdown={raw_score:0, final_score:null, contributions:[]}`. Keenam indikator menjadi uncertain. Materi kurang dari 40 karakter/enam token tanpa gambar mendapat respons ini sebelum provider dipanggil; pada input lain model juga memeriksa kecukupan/relevansi.

Referensi hanya lapisan konteks. Tidak adanya referensi, atau tidak tercantumnya sebuah lowongan pada portal tertentu, tidak menjadi bukti pelanggaran. Saat ini cakupan KB aktif terbatas pada dua entri yang dijelaskan dalam [README KB](../../data/knowledge/README.md). Tidak ada pasal yang dihasilkan LLM.

## Error

```json
{
  "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808",
  "error": {
    "code": "provider_not_configured",
    "message": "Gemini belum dikonfigurasi. Isi GEMINI_API_KEY pada backend, lalu jalankan ulang server.",
    "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808"
  }
}
```

| Status | Kategori utama |
|---|---|
| 400 | `empty_input`, `request_incomplete` |
| 413 | `request_too_large`, `image_too_large`, `image_dimensions_too_large`, `normalized_image_too_large` |
| 415 | `multipart_required`, `unsupported_image_type`, `image_type_mismatch`, `invalid_image`, `animated_image` |
| 422 | `invalid_content_length`, `invalid_multipart`, `unknown_form_field`, `duplicate_form_field`, `invalid_form_field`, `invalid_text` |
| 502 | `provider_error`, `provider_invalid_response` |
| 503 | `provider_not_configured`, `provider_auth_error`, `provider_rate_limited`, `provider_model_unavailable`, `provider_unavailable`, `service_not_ready` |
| 504 | `provider_timeout` |

Tidak ada skor sintetis pada kegagalan provider. Jangan mengandalkan kalimat pesan sebagai identifier; pakai status dan `error.code`. Raw input, isi error provider, key, dan traceback tidak diteruskan. Header CORS untuk origin yang diizinkan dan X-Request-ID juga berlaku pada jalur gagal.

## Kompatibilitas

Versi 0.2.0 menambah endpoint analisis terpadu; endpoint health, Swagger/OpenAPI, dan `/demo` tetap ada. Error sekarang menambah `request_id` di root; `error.request_id` lama tetap dipertahankan. CORS diperluas untuk POST dengan daftar origin eksplisit. Model/kontrak lengkap dihasilkan melalui OpenAPI dan schema Pydantic; perubahan kontrak berikutnya harus disertai tes dan catatan pada [changelog](../../CHANGELOG.md).
