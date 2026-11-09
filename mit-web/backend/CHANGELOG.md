# Changelog

Tujuan: merangkum perubahan proyek yang penting bagi pengembang dan integrator. Gunakan versi `MAJOR.MINOR.PATCH`; rilis awal ini belum menyatakan stabilitas API produk. Detail pekerjaan dan verifikasi ada di [worklog](docs/logs/WORKLOG.md).

## [Unreleased]

- Sahabat Jeli memakai ElevenLabs Flash v2.5 dengan suara Andi untuk ID dan George
  untuk EN saat tersedia. Google TTS dan suara browser menjadi cadangan.
- Rapor latihan dan PDF menampilkan progres serta pembahasan per jawaban tanpa
  skor agregat atau label kesiapan.

- Launcher lokal memulai backend dan frontend bersama. Request AI lokal melewati
  proxy Vite, dan gangguan backend menampilkan langkah pemulihan.

- Katalog dan sesi chat perekrut Jeli Lakon mendukung Indonesia dan Inggris.
  Pembuka, petunjuk, balasan, dan rapor mengikuti bahasa sesi.
- Pembaca URL memvalidasi redirect dan IP tujuan, memakai TLS terverifikasi, dan melaporkan
  halaman yang gagal dibaca. Analisis materi tidak cukup dan checksum indeks lintas OS diperbaiki.
- Jeli Lakon memisahkan latihan terpandu dan chat perekrut bertanda tangan. Skenario kustom
  berada di browser pengguna dan memakai rubrik terkurasi.
- Sahabat Jeli menandai fallback lokal. Audio memakai POST privat dan berhenti saat pindah halaman.

- Pencarian hukum dapat menampilkan satu pasal terverifikasi sebagai rujukan awal berdasarkan topik ketika kemiripan semantik di bawah ambang.
- Gemini menentukan kategori risiko, ringkasan, dan rekomendasi berdasarkan konteks, termasuk pada pesan singkat.
- Bundle RAG resmi pilot Pasal 11 berhasil mengembalikan tautan dan kutipan JDIH pada demo React.
- Build FastAPI di Vercel memverifikasi bundle RAG dan memaketkan file yang dibutuhkan saat runtime.

## [0.3.0] — 2026-11-05

- Breaking response: recognition-v2 memisahkan fraud_assessment dan legal_screening,
  mengganti skor/bobot dengan kategori kualitatif dan validasi konflik berbasis bukti.
- Pipeline PDF offline, plan/build/verify JSON statis read-only, provenance/checksum,
  pasal/halaman terkurasi, kompatibilitas embedding, top-k/relevance configurable dan fallback.
- Tooling ChromaDB lokal dev-only atas permintaan owner, ekspor JSON tervalidasi;
  tidak ada Chroma Cloud atau persistent database runtime Vercel.
- Pilot tunggal Permenaker 18/2024 Pasal 11 halaman 7 telah diverifikasi sumber/checksum;
  embedding resminya menunggu persetujuan kuota terpisah.
- Demo tanpa skor, hasil fraud/legal terpisah, raw JSON/error jujur dan MODE UJI MOCK.
- Profil upload Vercel 4 MiB beserta batas total multipart, entrypoint ASGI dan config bundle.
- Tests parser/index/embedding/Chroma/read-only/injection/mismatch dan regresi provider/upload.

Hasil mock tidak membuktikan kualitas model live atau akurasi. Tidak ada request AI live,
deployment, commit, atau push dalam pekerjaan ini. Detail pada laporan Fase A.

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
