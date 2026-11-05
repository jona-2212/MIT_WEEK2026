# Changelog

Tujuan: merangkum perubahan proyek yang penting bagi pengembang dan integrator. Gunakan versi `MAJOR.MINOR.PATCH`; rilis awal ini belum menyatakan stabilitas API produk. Detail pekerjaan dan verifikasi ada di [worklog](docs/logs/WORKLOG.md).

## [0.2.0] — 2026-10-31

### Added

- Recognition satu endpoint multipart untuk teks, gambar, dan gabungan; adaptor Gemini REST/HTTPX dengan output terstruktur dan timeout.
- Grounding kutipan, guard negasi terbatas, enam indikator, scoring deterministik versi rules-v1, cap dan breakdown tanpa hitung ganda.
- Retrieval lokal dengan dua sumber terverifikasi, gating metadata/tanggal/domain, serta fallback tanpa pasal rekaan.
- Demo HTML analisis dengan preview/hapus gambar, loading/error, skor/null, evidence, rekomendasi, referensi, dan request ID; server mock khusus tes diberi label eksplisit.
- Automated tests, sampel fiktif teks/PNG, kontrak frontend, test plan, dan ADR-0002.

### Changed

- Versi aplikasi menjadi 0.2.0; health/dokumentasi tetap tersedia. CORS memperbolehkan POST untuk origin eksplisit.
- Error menambah request_id pada root sambil mempertahankan error.request_id lama.
- Environment menyediakan GEMINI_MODEL dan GEMINI_TIMEOUT_SECONDS. Startup tidak melakukan request provider dan tetap berjalan tanpa key.

### Security

- Body/file/piksel dibatasi; MIME dicek terhadap decode aktual; animasi ditolak dan metadata gambar dibuang.
- Multipart tidak melakukan rollover raw upload ke disk; form terputus ditolak agar gambar tidak diam-diam diabaikan.
- Key tetap di backend; input, prompt, transkripsi, dan respons provider tidak direkam dalam log aplikasi.

Hasil mocked bukan bukti inferensi Gemini live atau akurasi. Cakupan hukum masih terbatas dan tidak menghasilkan putusan pelanggaran.

## [0.1.0] — 2026-10-31

### Added

- Fondasi backend FastAPI modular, application factory, health root dan v1, Swagger/OpenAPI, serta demo lokal.
- Konfigurasi Pydantic Settings, template environment, UUID request, log JSON aplikasi, dan penanganan error pusat.
- Dependency uv dan lockfile, baseline Python 3.11, pytest/Ruff, serta workflow CI.
- Instruksi agen, document router dan indeks, arsitektur, kontrak API, ADR/template, serta development worklog.

### Security

- `.env` lokal diabaikan Git; API key kosong/opsional dan direpresentasikan sebagai secret di konfigurasi.
- Origin CORS eksplisit, traceback HTTP dinonaktifkan, error/input sensitif tidak digemakan, dan metadata log dibatasi.

Fitur AI produk belum diimplementasikan; Product Blueprint awal dipertahankan.
