# ADR-0003 — Kategori kualitatif, RAG JSON, dan Chroma offline

- Status: Accepted melalui persetujuan owner pada 5 November 2026.
- Menggantikan bagian skor numerik dan KB indikator pada ADR-0002.
- Acuan: [SRS v1.2](../features/SRS_Jeli_F01_Backend_AI_Standalone_v1.2.md).

## Keputusan

1. Pertahankan backend/demo existing dan request multipart. Response recognition-v2
   memisahkan fraud_assessment dan legal_screening, tanpa angka skor/bobot.
2. Gemini mengekstraksi indikator/observasi dan mengusulkan kategori. Backend memvalidasi
   kutipan, negasi, duplikasi, konflik dan rubrik heuristik awal. Bukti/kategori yang
   tidak memadai menjadi insufficient_data; low bukan jaminan aman.
3. PDF hukum hanya input developer offline. pypdf menolak PDF rusak, terenkripsi,
   halaman kosong/scan dan batas ukuran/halaman. Pasal hanya dilabeli bila heading
   dan anchor halaman yang ditinjau cocok. Seleksi pasal membatasi korpus pilot.
4. Bundle legal-json-v1 berisi manifest.json, chunks.json, vectors.json; normalisasi L2,
   checksum PDF/teks/artefak, provenance, model/dimensi/task, tanggal review dan pengecualian.
   Runtime hanya membaca. Tidak ada public ingestion atau indexing saat startup/request.
5. Embedding dokumen/query memakai model dan dimensi yang sama, task RETRIEVAL_DOCUMENT
   dan RETRIEVAL_QUERY. Kandidat yang disetujui gemini-embedding-001/768; live belum diuji.
   Satu chunk = satu HTTP embedding; query maksimal satu request tambahan per analisis
   yang memerlukan retrieval. Tanpa retry otomatis. API bisa memakai kuota/biaya.
6. Cosine minimum 0,75 dan top-k 3 configurable, hanya parameter eksperimen. Gating sumber,
   tanggal, topik, pasal/halaman dan cakupan tetap wajib. Similarity bukan bukti pelanggaran.
7. Status legal: potential_issue, needs_more_context, no_relevant_reference,
   reference_unavailable. Regulasi tetap meminta verifikasi manusia atas cakupan dan
   pengecualian. RAG gagal tidak menggagalkan fraud yang valid.
8. Profil lokal mempertahankan 5 MiB; profil Vercel 4 MiB, total multipart masing-masing
   dibatasi tambahan 64 KiB. Entry point Vercel memakai factory yang sama. Deployment
   aktual bukan bagian pengujian yang diotorisasi.

## Perluasan owner sesudah checkpoint

Owner meminta penyimpanan ChromaDB lokal, memilih tetap Gemini dan **menunggu izin kuota**.
Chroma ditambahkan sebagai tooling dev/offline saja: simpan embedding yang telah dibuat,
lalu ekspor JSON tervalidasi untuk runtime. Tidak ada Chroma Cloud, API server Chroma,
default embedding otomatis, atau database persisten pada runtime Vercel. Telemetry
anonim dan reset dinonaktifkan. Koleksi versi berbeda tidak ditimpa/dihapus.

Owner kemudian membatasi pilot ke satu PDF. Pilihan: 2024pmnaker018.pdf yang cocok
byte-per-byte dengan sumber JDIH. Pilot hanya Pasal 11 halaman PDF 7, termasuk ayat
pengecualian. Manifest menghasilkan satu chunk dan satu request embedding dokumen
yang direncanakan; request itu belum dijalankan. Koleksi resmi masih kosong.

## Konsekuensi dan batas bukti

JSON portabel menghindari dependency runtime database/NumPy. Chroma/pypdf menambah
dependency dev saja. RAG dapat diuji tanpa API memakai fixture CC0 yang diberi label,
tetapi mock passing tidak membuktikan kualitas Gemini, embedding semantik, atau ambang.
Pergantian PDF/registry/model memerlukan rebuild, verifikasi, dan redeploy.

Pada 7 November 2026, pilot mendapat jalur pencocokan topik saat skor semantik di bawah
ambang. Jalur ini memerlukan tepat satu potongan regulasi berpasal terverifikasi yang
cocok dengan topik berbukti. Respons menyertakan `topic_match_only` dan
`needs_more_context` agar cakupan dan pengecualian diperiksa.

Inferensi live, embedding live, kalibrasi rubrik/relevance, build/deployment Vercel,
rate limiting publik, dan OCR independen tetap belum terverifikasi.
