# Test plan Fitur 01

Tujuan: menghubungkan acceptance criteria [brief](BRIEF.md) dengan bukti pengujian. Kontrak: [API Recognition](../../api/recognition.md). Hasil perintah aktual dan kegagalan selama pekerjaan dicatat di [worklog](../../logs/WORKLOG.md).

## Automated testing tanpa request eksternal

| Kriteria | Verifikasi |
|---|---|
| AC-01 / AC-02 / AC-03 | `test_recognition.py`: teks, JPEG/PNG/WebP, dan keduanya melalui multipart → adaptor HTTPX MockTransport → grounding → skor → KB → schema respons; satu request provider dan tanpa hitung ganda |
| AC-04 | Iklan biasa dengan negasi menghasilkan skor rendah tanpa klaim terverifikasi aman; guard negasi juga diuji saat ekstraksi salah menandai detected |
| AC-05 | Teks minim, konteks tak relevan, gambar tak terbaca → skor null dan insufficient_data |
| AC-06 | `test_scoring.py`: bobot server, urutan kontribusi stabil, state, deduplikasi, cap 135→100, batas level 24/25/49/50 |
| AC-07 | Grounding menolak kutipan rekaan, sumber absen, kutipan satu kata, dan pemotongan beberapa negasi eksplisit |
| AC-08 | MIME/decode/ukuran/file ganda/body chunked/multipart terputus; `test_uploads.py` memeriksa metadata, animasi, dan batas piksel; uji rollover menolak penulisan raw upload ke disk |
| AC-09 | `test_gemini.py` dan integration tests: missing key, auth, kuota, timeout nyata terikat, network error, output buruk/terpotong/terblokir/terlalu besar/extra skor |
| AC-10 | `test_knowledge.py`: gating status, metadata, domain resmi, expiry, fallback file hilang/rusak, dan skor tetap; juga fallback melalui endpoint |
| AC-11 | Kontrak HTML/OpenAPI diuji; uji browser manual/terbantu di bawah memeriksa interaksi UI nyata |
| AC-12 | Tes regresi fondasi tetap berjalan; request ID, token metadata, log tanpa input/key/query/exception mentah, serta POST CORS diperiksa |

Transport HTTPX eksternal diblokir autouse fixture. Request model menggunakan MockTransport; request FastAPI menggunakan ASGITransport dan lifespan eksplisit. Clock KB dibekukan ke snapshot kurasi 31 Oktober 2026 hanya dalam tes; log runtime tidak dibekukan. Sampel fiktif pada `data/examples/` adalah materi smoke test, bukan benchmark akurasi.

Perintah kualitas:

```powershell
uv sync --locked
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest -q
```

## Verifikasi demo biasa dan live provider

1. Jalankan aplikasi sesuai README; buka `/demo` dan `/docs`.
2. Submit kedua field kosong; browser harus memberi pesan tanpa request AI.
3. Pilih `data/examples/suspicious-synthetic.png`; lihat preview/nama file, lalu hapus dan pilih kembali.
4. Tanpa API key, kirim teks lengkap: tampilkan error 503 `provider_not_configured`, request ID, dan jangan menampilkan skor lama/fiktif.
5. Untuk live, isi key sah dan model yang tersedia pada `.env`, restart server, lalu kirim contoh teks, gambar, serta gabungan. Periksa score breakdown, bukti/sumber, unknowns, rekomendasi, referensi, disclaimer, dan ID. Ini mengirim materi fiktif ke Gemini dan dapat memakai kuota akun.
6. Bandingkan case normal/berisiko/ambigu. Periksa negasi dan transkripsi secara manual. Hasil mocked tidak menjadi bukti kualitas model nyata.

## Uji UI dengan provider mock yang diberi label

Untuk menguji rendering/loading/error tanpa kredensial:

```powershell
uv run --locked uvicorn tests.demo_server:create_test_app --factory --host 127.0.0.1 --port 8001 --no-access-log
```

Buka `http://127.0.0.1:8001/demo`. Banner **MODE UJI MOCK** dan judul hasil menegaskan bahwa ekstraksi merupakan fixture, bukan inferensi Gemini. Gunakan sampel yang disediakan; gambar pada mode ini diberi transkripsi fixture, bukan dibaca AI. Form tetap mengirim HTTP multipart dan seluruh validasi/scoring/KB/rendering backend berjalan. Jangan gunakan server ini sebagai command deployment atau bukti akurasi AI. Server biasa selalu memakai `app.main:create_app`.
