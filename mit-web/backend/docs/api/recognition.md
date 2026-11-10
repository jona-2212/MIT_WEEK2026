# API Fitur 01 â€” recognition-v2

Kontrak mengganti response numerik versi 0.2.0. Request multipart, endpoint health/docs/demo, request ID, dan envelope error dipertahankan. Acuan: [SRS](../features/SRS_Jeli_F01_Backend_AI_Standalone_v1.2.md), [ADR](../decisions/ADR-0003-qualitative-static-rag.md).

## Tautan publik

Field `url` meminta ekstraksi halaman publik. Pembaca menghubungi IP yang telah
divalidasi, memeriksa setiap redirect, dan mempertahankan verifikasi TLS.
Jika halaman gagal dibaca, URL saja menghasilkan HTTP 422 `url_content_unavailable`.
Jika pengguna juga mengirim teks atau gambar, respons memakai materi tersebut dan
menambahkan catatan pada `fraud_assessment.unknowns`.
Materi yang dinyatakan tidak cukup atau di luar konteks menghasilkan `insufficient_data`.

## Request

`POST /api/v1/analyze`, `multipart/form-data`. Minimal satu input; `X-Request-ID` UUID opsional.

| Field | Aturan |
|---|---|
| `text` | Opsional; trim; maksimal 12.000 karakter/48.000 byte mentah |
| `url` | Tautan publik HTTP(S), maksimal 2.048 karakter |
| `lang` | ID atau EN, default ID |
| `file` | Satu PNG/JPEG/WebP statis, 16 MP; 5 MiB lokal atau 4 MiB profil Vercel |

Total body termasuk semua field, header multipart, dan boundary maksimal batas gambar + 64 KiB: lokal 5.308.416 byte, Vercel 4.259.840 byte. Server memeriksa deklarasi maupun byte stream aktual. Form duplikat, field tak dikenal, boundary terputus, MIME/decode tidak cocok, animasi, PDF, dan file rusak ditolak.

Teks + gambar adalah satu kasus, satu panggilan generatif tanpa retry. URL dalam teks tidak di-fetch. Tidak ada endpoint ingestion PDF hukum.

```powershell
# MOCK: server tes port 8001, bukan Gemini live
curl.exe -X POST http://127.0.0.1:8001/api/v1/analyze -F "text=Lowongan staf administrasi PT Contoh Fiktif. Transfer biaya administrasi Rp150.000 sebelum wawancara. Konfirmasi hari ini juga."
curl.exe -X POST http://127.0.0.1:8001/api/v1/analyze -F "file=@data/examples/suspicious-synthetic.png;type=image/png"
```

Browser memakai FormData tanpa menetapkan Content-Type multipart manual. Input diproses pihak ketiga pada server biasa; pengguna perlu menyamarkan data pribadi.

## Response 200

| Field | Makna |
|---|---|
| `request_id` | UUID sesuai header X-Request-ID |
| `status` | completed atau insufficient_data, mengikuti kategori fraud |
| `analysis_version` | recognition-v2 |
| `input_mode` | text, image, both |
| `fraud_assessment` | risk_category, summary, indicators, unknowns, recommendations |
| `legal_screening` | status, summary, references, missing_facts, warnings |
| `disclaimer` | Rubrik heuristik awal; bukan jaminan aman atau putusan hukum |

Tidak ada risk_score, score_breakdown, scoring_version, atau bobot indikator. Masing-masing indikator berisi code, state detected/uncertain/not_detected, evidence source=text/image dan quote, serta reason.

Gemini menentukan kategori, ringkasan, dan rekomendasi dari konteks materi, termasuk pesan singkat yang lolos validasi input. FastAPI menyalin kategori dari hasil tervalidasi, menyaring kutipan indikator yang tidak cocok dengan sumber, dan mencari rujukan hukum secara terpisah. Lihat [ADR-0004](../decisions/ADR-0004-contextual-gemini.md).

| Status legal | Makna |
|---|---|
| `potential_issue` | Rujukan mendukung potensi isu untuk ditinjau; bukan vonis |
| `needs_more_context` | Fakta cakupan/pengecualian belum memadai |
| `no_relevant_reference` | Indeks belum memberi rujukan yang cocok melalui pencarian semantik atau pencocokan topik |
| `reference_unavailable` | Indeks/registry/embedding tidak tersedia atau tidak valid |

Setiap reference berasal dari chunk tersimpan: source_id, source_kind, chunk_id, title/type, article (nullable), official_url, excerpt, page_start/page_end, document_version, verification_status, verified_at/review_after, pdf_sha256/index_sha256, scope, exceptions. source_kind=test_fixture hanya pada mode tes dan bukan otoritas hukum. Pasal yang belum divalidasi tidak ditebak. Similarity tidak dipublikasikan sebagai probabilitas atau bukti pelanggaran.

Regulasi pada MVP selalu memerlukan pemeriksaan manusia atas jenis pelaksana/cakupan/pengecualian; fakta tersebut tidak diputus dari klaim model. Kegagalan RAG mempertahankan response fraud yang valid dan mengisi status reference_unavailable dengan warning aman. Ketidakcukupan materi fraud memberi HTTP 200 insufficient_data; input kosong/format invalid tetap error.

Jika skor semantik berada di bawah ambang dan topik berbukti hanya cocok dengan satu potongan regulasi berpasal terverifikasi, potongan itu dapat tampil sebagai rujukan awal. Respons memakai `needs_more_context` dan warning `topic_match_only`.

Contoh response lengkap berlabel **MOCK**: [recognition-mock.json](../examples/recognition-mock.json). Contoh OpenAPI juga sintetis dan tervalidasi, bukan hasil inferensi live.

## Error

Envelope tetap:

```json
{"request_id":"66f30281-d8e3-4fb6-9dfa-e48db972f808","error":{"code":"provider_not_configured","message":"Gemini belum dikonfigurasi. Isi GEMINI_API_KEY pada backend, lalu jalankan ulang server.","request_id":"66f30281-d8e3-4fb6-9dfa-e48db972f808"}}
```

| HTTP | Kategori |
|---|---|
| 400 | empty_input, request_incomplete |
| 413 | request_too_large, image_too_large, image_dimensions_too_large, normalized_image_too_large |
| 415 | multipart_required, unsupported_image_type, image_type_mismatch, invalid_image, animated_image |
| 422 | invalid_content_length, invalid_multipart, unknown_form_field, duplicate_form_field, invalid_form_field, invalid_text |
| 502 | provider_error, provider_invalid_response |
| 503 | provider_not_configured, provider_auth_error, provider_rate_limited, provider_model_unavailable, provider_unavailable, service_not_ready |
| 504 | provider_timeout |

Tidak ada fallback hasil AI palsu. Respons/log tidak mengandung key, traceback, raw prompt, atau error provider mentah. Gunakan code/status untuk mesin. CORS dan request ID tetap berlaku pada error.

## Migrasi

Klien lama yang membaca field numerik wajib beralih ke fraud_assessment dan legal_screening. Endpoint/field request tidak berubah. Frontend React produksi tidak diedit; demo mandiri sudah mengikuti kontrak baru. OpenAPI dan Pydantic adalah schema yang dieksekusi.

