# ADR-0002 â€” Recognition multimodal, skor deterministik, dan referensi lokal

- **Status:** Accepted dalam lingkup implementasi Fitur 01 yang diminta pengguna
- **Tanggal:** 2026-10-31

Tujuan: mencatat keputusan penting untuk [brief Recognition](../features/01-job-scam-recognition/BRIEF.md) setelah [fondasi](ADR-0001-project-foundation.md). Detail perilaku: [IMPLEMENTATION](../features/01-job-scam-recognition/IMPLEMENTATION.md).

## Konteks

AI Engineer memerlukan satu alur teks/gambar/gabungan yang bisa dipakai frontend terpisah dan diuji melalui HTML minimal. Bukti dan perhitungan harus dapat ditelusuri; privasi melarang penyimpanan input mentah default. Belum ada API key Gemini lokal. Brief mengizinkan pengujian mocked serta fallback referensi jika belum tervalidasi, tetapi melarang hasil AI tiruan pada demo biasa.

## Keputusan

1. Gunakan satu endpoint multipart `/api/v1/analyze`. Validasi body sebelum parsing, gunakan parser Starlette dengan spool dalam memori dan callback penutup multipart. Pillow diperlukan untuk decoding penuh, batas piksel, penolakan animasi, dan pembuangan metadata. Dua dependency baru adalah `python-multipart` dan Pillow; uv/lockfile tetap tunggal.
2. Gunakan HTTPX yang sudah ada untuk REST Gemini `generateContent`, image inline, system instruction, dan structured output. Kontrak diperiksa pada dokumentasi Google saat implementasi. Hindari SDK tambahan, tool browsing, Files API, rantai agent, dan retry otomatis. Satu kasus memerlukan maksimal satu request model. Model, kuota, dan key valid harus diverifikasi pemilik akun sebelum live.
3. Model hanya mengekstraksi konteks/indikator/evidence. Pydantic menolak skor atau field tambahan. Grounding memeriksa kutipan terhadap sumber yang tersedia; beberapa negasi eksplisit dilindungi tambahan. Python menghitung keenam bobot versi `rules-v1`, melakukan deduplikasi, cap, dan breakdown. Ringkasan/rekomendasi disusun server agar tidak menerima nasihat bebas atau klaim hukum dari model.
4. Gunakan JSON terkurasi dan retrieval deterministik per kode indikator. Hanya referensi verified dengan metadata/domain/tanggal/pengecualian valid yang dipakai; kandidat pending tidak ditampilkan. Tidak ada vector DB. Referensi tidak mengubah skor.
5. Pertahankan API health dan endpoint dokumentasi. CORS diperluas dengan POST. Tambahkan `request_id` pada root error sambil mempertahankan `error.request_id` untuk kompatibilitas. Dokumentasikan kontrak baru dan versi aplikasi 0.2.0.
6. Uji jalur provider melalui HTTPX MockTransport, bukan memintas seluruh pipeline. Server tambahan `tests.demo_server` khusus verifikasi browser diberi banner **MODE UJI MOCK**, tidak diaktifkan melalui environment produksi. Demo `/demo` biasa tetap menggunakan provider nyata atau mengembalikan error jujur bila belum dikonfigurasi.

## Alternatif yang dipertimbangkan

- **Endpoint teks/gambar terpisah:** memperumit form gabungan dan deduplikasi; brief terbaru menetapkan satu kasus multipart.
- **Google GenAI SDK:** valid untuk pengembangan mendatang, tetapi HTTPX sudah ada dan REST mencukupi satu operasi yang diperlukan saat ini.
- **OCR kedua:** dapat meningkatkan pemeriksaan independen, tetapi menambah layanan/latensi dan berada di luar kebutuhan MVP. Konsistensi image evidence terhadap transkripsi model saat ini belum membuktikan kebenaran pembacaan piksel.
- **UploadFile otomatis tanpa penyesuaian parser:** dapat melakukan rollover ke disk di atas 1 MiB. Parsing terbatas dalam memori memenuhi kebijakan input; konsekuensinya request schema Swagger ditulis eksplisit dan diuji kontraknya.
- **Skor/penjelasan hukum langsung dari LLM:** tidak menjamin perhitungan stabil atau sumber valid; ditolak.

## Konsekuensi

Pipeline dapat diuji tanpa API key dan tetap memberi kontrak yang sama untuk ketiga modalitas. Scoring dapat dihitung ulang, sementara model, transkripsi, dan penafsiran semantiknya masih dapat keliru. Bobot dan ambang belum merupakan hasil evaluasi statistik. Teks terlalu pendek diberi insufficient_data sebelum request provider; input gabungan tetap memakai keduanya sebagai satu kasus.

Parser memori dan helper konteks route bergantung pada perilaku versi Starlette/FastAPI yang dikunci; tes rollover, multipart terputus, dan kontrak perlu dijalankan saat upgrade. Setiap request dibatasi byte/piksel/timeout, tetapi pembatasan trafik/rate limit publik masih perlu dirancang saat deployment. Kunci kosong tidak menghambat startup/health, namun analisis bermateri cukup menghasilkan 503. Tidak ada hasil Gemini live yang diklaim telah diuji dalam kondisi tersebut.

Referensi teknis: [Gemini structured output REST](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [Gemini image inline](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding), [model yang tersedia](https://ai.google.dev/gemini-api/docs/models). Sumber hukum/panduan tercatat terpisah dalam [README KB](../../data/knowledge/README.md), dan hasil aktual pada [worklog](../logs/WORKLOG.md).

