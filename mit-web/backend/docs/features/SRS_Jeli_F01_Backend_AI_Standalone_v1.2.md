---
title: "SRS â€” Jeli Fitur 01: AI Job Scam Recognition"
subtitle: "Backend AI mandiri, demo HTML, dan RAG PDF hukum dengan indeks statis read-only"
author: "Tim AI Engineering â€” MIT-WEEK 2026"
date: "5 November 2026"
version: "1.2 (keputusan A: static local vector index; Chroma Cloud fase B)"
status: "Keputusan inti disetujui; detail yang belum diputuskan ditandai USULAN"
---

# Software Requirements Specification (SRS)

**Produk:** Jeli â€” MIT-WEEK 2026  
**Fitur:** F01 â€” AI Job Scam Recognition & Employment Compliance Screening  
**Versi:** 1.2, 5 November 2026  
**Status:** Baseline implementasi MVP mandiri + RAG PDF hukum internal; keputusan terbuka tercantum pada Â§12  
**Repositori:** `lalalostcode/MIT_WEEK2026` (baseline pemeriksaan: branch `main`, commit `2fdb3f2`)  
**Lokasi kerja:** `mit-web/backend/`  
**Pemilik keputusan:** AI Engineer/pemilik fitur, berkoordinasi dengan tim Jeli

> **Tujuan dokumen:** menjadi sumber kebutuhan untuk AI coding agent yang akan **menyesuaikan backend AI yang sudah ada**, bukan membangun aplikasi baru dari nol. Untuk fase ini **jangan menyentuh `mit-web/frontend/` maupun `mit-web/backend/`**. Jangan membuat fitur URL, crawling, ataupun integrasi React. PDF hukum masuk ke sistem hanya melalui **pipeline indexing internal milik developer**, bukan endpoint upload publik. Setiap detail bertanda **USULAN / OPEN** harus diajukan kepada pemilik fitur sebelum dikunci dalam arsitektur.

## 1. Ringkasan dan keputusan produk

Jeli membantu pencari kerja Indonesia mengenali indikasi penipuan rekrutmen dari **teks** dan/atau **screenshot**. Backend mengirim materi ke **Google Gemini API**, memeriksa kesesuaian bukti, dan menghasilkan kategori risiko **kualitatif** beserta alasan dan tindakan aman. Sistem juga melakukan **screening kemungkinan isu ketenagakerjaan** dengan referensi resmi terkurasi; hasil hukum dipisahkan dari penilaian penipuan. Sistem **bukan** layanan verifikasi identitas perusahaan, alat pembuktian tindak pidana, ataupun pemberi pendapat hukum definitif.

### 1.1 Keputusan yang sudah disetujui

| ID | Keputusan | Status |
|---|---|---|
| DEC-001 | Fitur memuat **fraud screening** dan **employment compliance screening** sebagai dua keluaran berbeda. | DISETUJUI |
| DEC-002 | Hasil risiko MVP berupa `high`, `medium`, `low`, atau `insufficient_data`; **tanpa angka 0â€“100, persentase, atau klaim probabilitas**. | DISETUJUI |
| DEC-003 | **Gemini API** menganalisis konteks, mengekstraksi indikator dan bukti, serta mengusulkan kategori dengan rubrik eksplisit; **FastAPI** memvalidasi struktur, bukti, dan ketidakpastian. | DISETUJUI |
| DEC-004 | Referensi hukum hanya dari sumber resmi yang dikurasi/diverifikasi; Gemini tidak boleh mengarang pasal. PDF hukum internal menjadi korpus RAG setelah diverifikasi. | DISETUJUI |
| DEC-005 | Input MVP: **teks saja, gambar saja, atau kombinasi teks + gambar**. | DISETUJUI |
| DEC-006 | Tidak ada training/fine-tuning atau hosting model sendiri. **MVP memakai indeks vektor lokal, statis dan read-only** untuk RAG PDF hukum; tidak ada managed/cloud vector database pada fase A. | DISETUJUI (revisi 5 Nov) |
| DEC-007 | **Fase ini mandiri:** FastAPI + demo HTML minimal; **integrasi frontend utama ditunda**. | DISETUJUI |
| DEC-008 | **URL/link sebagai mode input, scraping, dan fetch website ditunda**. Teks yang mengandung URL tetap diperlakukan sebagai teks, tanpa akses keluar ke URL tersebut. | DISETUJUI |
| DEC-009 | Perubahan kode baru dilakukan oleh coding agent setelah perintah pemilik proyek; dokumentasi ini sendiri tidak mengubah repo. | DISETUJUI |
| DEC-010 | PDF regulasi diinput **hanya oleh tim Jeli** melalui perintah/script indexing internal, **bukan** oleh user website atau melalui dashboard admin. | DISETUJUI |
| DEC-011 | **Fase A terlebih dahulu:** indeks vektor lokal read-only di dalam artefak deployment. **Fase B (Chroma Cloud)** dipertimbangkan setelah Fase A benar-benar berjalan dan lolos uji; tidak diimplementasikan sekarang. | DISETUJUI |
| DEC-012 | Kompatibilitas Vercel menjadi kendala desain: query RAG tidak boleh bergantung pada penulisan persisten ke disk saat runtime. Deployment Vercel bukan deliverable wajib pada fase uji lokal. | DISETUJUI |

### 1.2 Prinsip penerimaan

**Prioritas utama:** alur end-to-end dapat berjalan dan diuji: `PDF resmi â†’ indeks vektor statis (offline)`, lalu `input pengguna â†’ POST /api/v1/analyze â†’ Gemini â†’ validasi/grounding â†’ retrieval RAG read-only â†’ response JSON â†’ demo HTML`. Kualitas visual demo bersifat sekunder. Jalur mock dan jalur live harus diberi label berbeda, tidak boleh saling disamarkan.

## 2. Ruang lingkup MVP

### 2.1 Dalam lingkup (in scope)

1. REST API `POST /api/v1/analyze` menerima multipart form data: teks dan/atau satu screenshot.
2. Analisis pesan rekrutmen berbahasa Indonesia, termasuk konteks negatif/penyangkalan dan ketidakpastian.
3. Empat kategori fraud kualitatif dan indikator dengan kutipan bukti yang bisa ditelusuri.
4. Screening potensi isu ketenagakerjaan secara **terpisah**, menggunakan **retrieval semantik atas potongan PDF hukum resmi yang diindeks oleh developer**, dengan metadata sumber/pasal/halaman/versi dan pemeriksaan ruang lingkup.
5. Script/CLI internal untuk mengekstraksi teks PDF, chunking, membuat embedding, menyimpan indeks portabel statis/read-only, dan mencatat hasil indexing (termasuk dokumen gagal).
6. FastAPI health, OpenAPI/Swagger, error response yang aman, request ID, dan logging metadata minimal.
7. Demo HTML satu halaman untuk mengirim request dan memperlihatkan respons terstruktur serta raw JSON untuk debugging.
8. Test otomatis (provider mock) dan checklist pengujian live saat kredensial Gemini tersedia.
9. README/runbook cara instalasi, menjalankan, menguji, dan batas klaim model.

### 2.2 Di luar lingkup (out of scope)

- Integrasi halaman `mit-web/frontend/` (React), desain UI produksi, routing website Jeli, serta perubahan `mit-web/backend/` lama.
- Input URL/link sebagai mode tersendiri; fetch URL, scraping, analisis domain dan verifikasi identitas perusahaan melalui internet.
- Training atau fine-tuning model, **Chroma Cloud/managed vector database**, indexing PDF saat request pengguna, endpoint upload PDF hukum untuk pengguna/admin, dashboard pengelolaan dokumen, autentikasi pengguna, histori analisis, chat assistant, voice, simulator, pelaporan otomatis, dan deployment publik. **Embedding untuk membangun/mencari indeks lokal justru termasuk scope Fase A**, dengan batas biaya di Â§5/Â§8.
- Pernyataan bahwa rekrutmen **pasti aman/palsu** atau **pasti melanggar** pasal tertentu tanpa fakta yang memadai.

## 3. Baseline implementasi repository

Pembacaan terakhir terhadap branch `main` menunjukkan komponen berikut **sudah ada** dan harus digunakan kembali.

| Lokasi existing | Fungsi | Penyesuaian yang diperlukan |
|---|---|---|
| `app/main.py` | FastAPI factory, router, middleware, `/demo` | Pertahankan startup, health, demo, dan error handling. |
| `app/api/v1/analyze.py` | Endpoint multipart `POST /api/v1/analyze` | Selaraskan response schema baru tanpa skor numerik. |
| `app/services/ai/gemini.py` dan prompt `recognition-v1.txt` | Adapter Gemini dan ekstraksi terstruktur | Tambahkan keluaran kategori kualitatif sesuai rubrik; validasi format. |
| `app/services/recognition.py` | Orkestrasi AI, evidence, rekomendasi, KB | Pisahkan fraud assessment dan legal screening. |
| `app/services/risk/grounding.py` | Pemeriksaan kutipan/negasi | Reuse; perkuat pengujian atas bukti dan uncertainty. |
| `app/services/risk/scoring.py` | Bobot heuristik 0â€“100 | **Tidak boleh lagi menjadi sumber kategori/scores publik**; rencanakan deprecation/replacement. |
| `app/services/knowledge/retrieval.py` dan `data/knowledge/sources.json` | Referensi JSON resmi terkurasi | Reuse sebagai **registry dokumen**, aktifkan retriever vektor statis di samping metadata validator; jangan mengaktifkan sumber berstatus pending. |
| **Baru â€” `scripts/` dan `data/legal_index/` (nama final usulan)** | Index builder PDF + artefak embedding dan metadata | Tambahkan pipeline offline yang **tidak dijalankan** oleh request user / server start; format indeks final OPEN-07. |
| **Baru â€” `app/services/knowledge/` adapter index** | Semantic retrieval read-only dari bundle | Interface retriever terpisah dari orkestrasi; dapat dipindah ke cloud kelak tanpa mengubah kontrak API. |
| `app/schemas/recognition.py` | Skema respons existing | Sesuaikan dengan kontrak kualitatif yang disetujui. |
| `demo/index.html` | Demo HTML internal | Jadikan antarmuka sederhana yang menampilkan hasil asli API. |
| `tests/` dan `tests/demo_server.py` | Tes mock serta demo mock | Perbarui sesuai kontrak dan beri label jelas mode mock. |
| `README.md`, `docs/api/recognition.md`, `docs/architecture/SYSTEM_OVERVIEW.md` | Dokumentasi existing | Perbarui seperlunya; jangan menulis ulang dokumentasi tanpa alasan. |

**Baseline teknis:** Python 3.11+, `uv`, FastAPI, Pydantic v2, HTTPX, Pillow, Gemini REST API, JSON local knowledge registry, dan **indeks embedding statis** hasil indexing PDF developer. Parsing PDF/embedding perlu dependency tambahan yang dibatasi; parser dan embedding provider final masih OPEN-07/OPEN-08. Tidak ada kebutuhan menambahkan dependency frontend. Sebelum mengubah kode, agent harus memeriksa **status working tree** dan perubahan dari rekan tim agar tidak menimpa pekerjaan lain.

## 4. Alur sistem yang disetujui

**A. Offline/internal â€” hanya tim Jeli; tidak dipanggil per request**

```text
PDF hukum resmi + manifest sumber terverifikasi
    â†’ parsing teks & pemeriksaan PDF berbasis teks
    â†’ chunking (pasal/bab jika terdeteksi; halaman tetap tercatat)
    â†’ embedding dokumen + metadata & pemeriksaan hasil
    â†’ artefak indeks vektor statis, versioned, read-only
    â†’ ikut dibundel bersama backend saat deploy
```

**B. Online â€” permintaan pengguna**

```text
Demo HTML lokal (hanya untuk uji)
   â”‚  text dan/atau image (FormData)
   â–¼
POST /api/v1/analyze  â€” FastAPI
   â”œâ”€ Validasi input, ukuran, MIME, dan batas request
   â”œâ”€ Gemini API â†’ ekstraksi konteks, red flags, bukti, usulan kategori
   â”œâ”€ Pydantic + evidence grounding + pemeriksaan ketidakpastian
   â”œâ”€ Fraud assessment â†’ kategori kualitatif + alasan + rekomendasi
   â”œâ”€ Semantic retrieval â†’ indeks vektor statis/read-only (RAG)
   â”œâ”€ Gating sumber, verifikasi pasal/halaman, applicability/exception check
   â”œâ”€ Legal screening terpisah + kutipan resmi dan batas penerapan
   â–¼
JSON response + request_id
   â–¼
Demo HTML: tampilkan hasil atau error dengan jujur
```

**Catatan:** RAG berbasis **indeks vektor portabel statis** disetujui untuk fase A; **tidak** mensyaratkan proses server database lokal maupun Chroma Cloud. Pemeriksaan hukum menyatakan relevansi/potensi isu dan kebutuhan verifikasi, bukan vonis. Saat indeks tidak ada/rusak/kosong, analisis fraud tetap dapat dilayani dengan `legal_screening.status = reference_unavailable` (status final OPEN-02), tanpa referensi atau pasal yang dibuat-buat. **PDF indexing tidak dilakukan saat request pengguna dan tidak bergantung pada disk persisten Vercel.**

## 5. Kebutuhan fungsional (FR)

**FR-01 â€” Input dan validasi.** Sistem menerima `text` (string), `file` (satu PNG/JPEG/WebP), atau keduanya, dalam `multipart/form-data`. Minimal satu materi bermakna harus ada. Pertahankan batas existing: teks maksimal **12.000 karakter**, gambar maksimal **5 MiB / 16 MP**, kecuali perubahan keamanan yang dijelaskan dan disetujui. Input kosong, malformed, ukuran/format invalid harus ditolak dengan HTTP status dan error code yang tepat. Gambar bersifat tidak tepercaya dan tidak disimpan permanen.

**FR-02 â€” Analisis kontekstual Gemini.** Backend memanggil Gemini **satu kali per kasus yang valid** (kecuali mekanisme retry yang kelak disetujui), meminta keluaran JSON terstruktur sesuai skema internal, dan memisahkan materi pengguna dari instruksi sistem. Model mengidentifikasi konteks rekrutmen, indikator, kutipan, serta ketidakpastian. Jangan mengklaim inferensi live bila hanya menggunakan mock.

**FR-03 â€” Evidence grounding.** Indikator berstatus `detected` wajib disertai kutipan yang benar-benar ada di teks atau transkripsi screenshot. Backend menolak/mendegradasi indikator tanpa bukti yang cocok, membedakan `not_detected` dan `uncertain`, serta menguji kalimat negasi dan contoh edukatif. Untuk screenshot, akui bahwa pembacaan menggunakan vision model dan belum diverifikasi melalui OCR independen.

**FR-04 â€” Fraud category kualitatif.** Kategori hanya `high`, `medium`, `low`, atau `insufficient_data`. Gemini menentukan kategori berdasarkan konteks. FastAPI memvalidasi skema dan kutipan indikator. [ADR-0004](../decisions/ADR-0004-contextual-gemini.md) memperbarui keputusan penilaian pada Â§6.

**FR-05 â€” Explanation dan safe action.** Kembalikan ringkasan Bahasa Indonesia, daftar indikator, bukti, fakta yang belum diketahui (`unknowns`), rekomendasi praktis, dan disclaimer. Jangan menyarankan transfer uang, membagikan OTP, atau menghubungi perekrut melalui kontak yang belum diverifikasi sebagai jalan utama pengecekan.

**FR-06 â€” Legal/compliance screening.** Return bagian hukum **terpisah** dari hasil fraud, minimal status, ringkasan, sumber yang relevan (jika tersedia), serta fakta yang kurang. Relevansi suatu aturan **tidak otomatis** berarti pelanggaran. Jenis perekrut, hubungan kerja, cakupan, ketentuan yang berlaku, dan pengecualian harus dipertimbangkan. Ketika fakta/sumber tidak cukup, tulis **perlu verifikasi/rujukan belum tersedia**, bukan vonis.

**FR-07 â€” Referensi resmi terkurasi dan RAG.** `data/knowledge/sources.json` menjadi **registry sumber**, bukan pengganti potongan teks PDF hukum. Semantic retrieval dilakukan atas potongan PDF yang telah diindeks oleh developer, lalu diloloskan lewat aturan verifikasi existing. Tidak boleh menghasilkan pasal, URL, judul, tanggal, kutipan, atau halaman baru dari imajinasi model. Sumber `pending_verification`, kedaluwarsa, salah versi, tidak sesuai ruang lingkup, atau tidak cocok dengan kasus tidak boleh tampil sebagai dasar hukum final. Hasil referensi harus menyertakan setidaknya `source_id`, judul/jenis, nomor pasal/halaman **jika terbukti dalam dokumen**, URL resmi, cuplikan/tautan yang bisa ditelusuri, status/tanggal verifikasi dan pengecualian. Jika PDF tidak memuat pasal yang dapat diekstraksi andal, jangan menebak nomornya.

**FR-08 â€” Demo HTML minimal.** Gunakan `demo/index.html` yang sudah ada. Form: textarea, upload file, tombol **Analisis**, tombol **Reset** (boleh tetap sederhana), loading, hasil fraud, hasil legal, bukti, rekomendasi, raw JSON, dan error. Tampilkan pemberitahuan sebelum submit bahwa teks/gambar akan diproses Gemini; anjurkan menyamarkan data pribadi. Demo bukan UI final Jeli dan tidak perlu redesign.

**FR-09 â€” Jalur mock dan live.** Mock server untuk pengujian tanpa kredensial disajikan sebagai **MODE UJI MOCK**. Server production-like menggunakan Gemini; jika key kosong, provider error, kuota habis, atau timeout, tampilkan error jujur dengan HTTP status yang benar. Tidak boleh mengembalikan hasil simulasi sebagai analisis nyata.

**FR-10 â€” API dan dokumentasi.** Pertahankan `/health`, `/api/v1/health`, `/docs`, `/demo` serta `POST /api/v1/analyze`. Dokumentasikan perubahan schema (`recognition-v2` sebagai **usulan**), contoh request, respons sukses/error, dan cara menjalankan dua mode.

**FR-11 â€” Tanpa URL fetch.** Jika pesan mengandung `https://...`, URL hanya merupakan string dalam teks yang dianalisis. Sistem tidak mengambil konten URL, melakukan browsing/scraping, memeriksa domain, maupun menyatakan URL aman berdasarkan pengecekan eksternal.

**FR-12 â€” Indexing PDF internal/offline.** Sediakan CLI/script internal yang dapat dijalankan developer pada laptop/CI terkontrol dengan daftar PDF resmi dan manifest: `source_id`, URL resmi, judul, jenis, tanggal/versi, status verifikasi, tanggal review, pengecualian, dan checksum. Script mengekstraksi teks, mencatat nomor halaman, mengelompokkan chunk dengan batas ukuran, membuat embedding, serta menulis **artefak indeks portabel deterministik**. Sumber berstatus pending/expired dilarang aktif. PDF hasil scan/image-only atau parsing kosong harus ditandai gagal/ditunda, **bukan** diisi teks hasil halusinasi atau OCR implisit. Index builder tidak diekspos sebagai endpoint HTTP.

**FR-13 â€” Retrieval vektor read-only di runtime.** Backend memuat artefak terpaket dari path konfigurasi yang eksplisit dan hanya melakukan **read**; tidak membuat/memodifikasi DB saat startup/request. Query diproduksi dari indikator/konteks yang lolos grounding. Query embedding harus memakai **model dan dimensi yang kompatibel** dengan embedding chunk; simpan versi/model/parameter dalam manifest dan validasi mismatch. Retrieval menggunakan pencarian similaritas dengan top-k terbatas, minimum relevance/gating yang terdokumentasi, deduplikasi, dan cek applicability. **Similarity tinggi saja bukan bukti pelanggaran hukum.** Interface retrieval harus dapat diganti untuk future Chroma Cloud tanpa mengganti respons API.

**FR-14 â€” Ketersediaan, pengamanan dan biaya RAG.** Indeks hilang, kosong, korup, chunk tanpa URL/halaman, sumber kedaluwarsa, dan provider embedding gagal harus ditangani dengan status `reference_unavailable`/`needs_more_context` serta peringatan; analisis fraud tidak boleh berubah menjadi klaim hukum palsu. Tidak boleh menulis file persistent saat request. Cegah prompt injection dari PDF sebagai sumber yang tidak tepercaya, pembatasan ukuran/jumlah PDF saat build, pengiriman dokumen ke provider embedding hanya bila kebijakan/biaya disetujui, dan perintah rebuild idempotent. Embedding **mungkin memerlukan API berbayar**; ketiadaan biaya vector DB cloud **bukan** jaminan seluruh pipeline gratis.

### 5.1 Kriteria data legal index (mandatory)

| Elemen | Kebutuhan |
|---|---|
| Provenance | `source_id`, tautan dokumen resmi, judul/nomor peraturan dan checksum PDF. |
| Struktur | `chunk_id`, teks asli, halaman yang valid, pasal/bab jika berhasil ditentukan. |
| Validitas | `verification_status`, `verified_at`, `review_after`, cakupan dan pengecualian. |
| Embedding | `model_id`, dimensi, versi, embedding/task type, timestamp build, checksum index. |
| Pengamanan | Bukan input pengguna; developer review; indeks read-only; tanpa API key, data pribadi, atau file tak berizin. |
| Rebuild | Jika PDF berubah, build ulang dan **redeploy** untuk mengganti indeks A. |
| Deployment | Ukuran artefak dan dependency harus diperiksa terhadap batas bundle Python Functions Vercel. |

### 5.2 Keputusan implementasi yang MASIH terbuka

- **OPEN-07:** format artefak dan library retrieval. Preferensi awal: **JSON/NPZ statis** (untuk korpus kecil) tanpa servis lokal yang menulis SQLite; pilihan final harus dikonfirmasi setelah proof-of-concept Vercel-read-only. `Chroma PersistentClient` yang memerlukan write bukan requirement A.
- **OPEN-08:** model embedding, library PDF parsing, chunk size/overlap, kebijakan query embedding runtime, dan batas kuota. Usulan: satu model embedding konsisten untuk `RETRIEVAL_DOCUMENT` dan `RETRIEVAL_QUERY`; hindari mengikat versi model yang belum diuji. Bila query embedding membutuhkan Gemini API, hal itu tetap menambah request dan konsumsi kuota.
- **OPEN-09:** ambang relevansi/top-k dan strategi fallback saat kualitas retrieval rendah. Perlu uji pada pertanyaan yang relevan, tidak relevan, dan dokumen dengan pengecualian.

## 6. Metodologi dan rubrik kategori (USULAN â€” perlu persetujuan)

Bagian ini mencatat rancangan awal. Implementasi saat ini mengikuti [ADR-0004](../decisions/ADR-0004-contextual-gemini.md).

Literatur deteksi penipuan rekrutmen mendukung penggunaan fitur linguistik dan indikator berbasis pengetahuan; **literatur tidak otomatis memvalidasi aturan kategori Jeli**. Karena tidak ada training maupun data kalibrasi dalam MVP, kategori adalah *qualitative screening judgement*, **bukan estimasi probabilitas penipuan**.

### 6.1 Kelompok indikator awal

| Kode | Makna | Guardrail penting |
|---|---|---|
| `upfront_payment` | Permintaan transfer/deposit/biaya sebagai syarat tahapan rekrutmen | Harus ada permintaan aktual, bukan kalimat penyangkalan. |
| `credential_request` | Meminta OTP, PIN, password, atau akses akun | Jangan salah klasifikasi pesan edukasi keamanan. |
| `premature_sensitive_data` | Meminta dokumen/data sensitif tanpa kebutuhan yang jelas | Bedakan dari permintaan administratif sah sesuai konteks. |
| `urgency_pressure` | Desakan waktu/ancaman kehilangan kesempatan | Tidak menentukan kategori tinggi sendirian. |
| `unrealistic_offer` | Tawaran tampak tidak wajar relatif terhadap pekerjaan/proses | Nominal gaji saja tidak cukup. |
| `unofficial_channel` | Identitas/kanal mencurigakan disertai indikasi pendukung | Gmail atau WhatsApp sendiri bukan bukti fraud. |

### 6.2 Rubrik kategori sementara

| Kategori | Kondisi usulan | Batasan wajib |
|---|---|---|
| `high` | Ada permintaan tindakan berbahaya yang **eksplisit** dan evidence kuat, misalnya transfer biaya rekrutmen atau menyerahkan OTP. | Tidak boleh atas dasar keyword tanpa konteks. |
| `medium` | Ada beberapa indikator pendukung yang konsisten, tetapi belum ada bukti kuat untuk `high`. | Hindari kombinasi indikator yang hanya duplikasi frasa. |
| `low` | Konten cukup untuk diperiksa dan belum ditemukan indikator bermakna yang didukung bukti. | **Tidak** berarti lowongan asli, legal, atau terverifikasi. |
| `insufficient_data` | Konten terlalu pendek, tidak relevan, gambar tak terbaca, atau bukti/kategori tidak dapat divalidasi. | Jangan memaksa model memilih `low`. |

**Kebijakan konflik sementara:** bila bukti tidak cocok, Gemini tidak konsisten, atau hasil hukum tidak memiliki landasan cukup, sistem menyatakan ketidakpastian dan tidak mengeluarkan vonis. **OPEN-01:** agent harus mengajukan rubrik operasional singkat dan kasus contoh untuk persetujuan sebelum mengubah kategori produksi.

## 7. Kontrak API (request existing; response PROPOSAL)

### 7.1 Request yang harus dipertahankan

`POST /api/v1/analyze`, `Content-Type: multipart/form-data`.

| Field | Tipe | Ketentuan |
|---|---|---|
| `text` | string opsional | Boleh kosong jika ada file; maks. 12.000 karakter. |
| `file` | binary opsional | Satu PNG/JPEG/WebP sesuai validasi existing. |

Minimal salah satu terisi. Jangan mengatur `Content-Type` multipart secara manual di browser; `FormData` membuat boundary sendiri. `X-Request-ID` adalah header tracing opsional jika didukung kontrak existing.

Contoh pengujian dari folder `mit-web/backend/`:

```powershell
# Teks saja; membutuhkan API key live agar dianalisis Gemini
curl.exe -X POST http://127.0.0.1:8000/api/v1/analyze `
  -F "text=Lowongan fiktif: transfer biaya administrasi Rp150.000 sebelum wawancara."

# Gambar saja (fixture sintetis, bukan data pengguna nyata)
curl.exe -X POST http://127.0.0.1:8000/api/v1/analyze `
  -F "file=@data/examples/suspicious-synthetic.png;type=image/png"
```

### 7.2 Response sukses â€” USULAN struktur `recognition-v2`

```json
{
  "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808",
  "status": "completed",
  "analysis_version": "recognition-v2",
  "input_mode": "text",
  "fraud_assessment": {
    "risk_category": "high",
    "summary": "Ada permintaan pembayaran sebelum wawancara.",
    "indicators": [
      {
        "code": "upfront_payment",
        "state": "detected",
        "evidence": [
          {"source": "text", "quote": "transfer biaya administrasi Rp150.000 sebelum wawancara"}
        ],
        "reason": "Ada instruksi transfer sebagai syarat rekrutmen."
      }
    ],
    "unknowns": ["Identitas perekrut belum diverifikasi secara independen."],
    "recommendations": ["Jangan transfer sebelum verifikasi melalui kanal resmi."]
  },
  "legal_screening": {
    "status": "needs_more_context",
    "summary": "Isu biaya rekrutmen mungkin relevan; jenis perekrut belum diketahui.",
    "references": [],
    "missing_facts": ["Jenis perekrut dan skema penempatan kerja."]
  },
  "disclaimer": "Hasil screening indikatif; bukan jaminan keamanan atau putusan hukum."
}
```

**Penting:** JSON di atas adalah **contoh kontrak**, bukan hasil AI live atau penilaian hukum kasus nyata. `references` pada hasil sukses harus berasal dari **chunk terambil yang lolos verifikasi**, dengan metadata sumber/pasal/halaman dan bukti cuplikan; ketika retrieval gagal, array kosong dan status unavailable/needs more context. Jangan memasukkan skor similarity sebagai peluang pelanggaran. Tidak ada skor numerik. Detail enum `legal_screening.status`, aturan status `insufficient_data`, dan migrasi schema masih **OPEN-02**. Agent harus mengusulkan format paling sederhana dan memerlukan persetujuan sebelum mengunci breaking change. Batas minimum: fraud dan legal terpisah serta ada request ID, kategori kualitatif, bukti, batasan, rekomendasi dan disclaimer.

### 7.3 Error response

Pertahankan pola existing, misalnya:

```json
{
  "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808",
  "error": {
    "code": "provider_not_configured",
    "message": "Gemini belum dikonfigurasi. Isi GEMINI_API_KEY pada backend.",
    "request_id": "66f30281-d8e3-4fb6-9dfa-e48db972f808"
  }
}
```

Gunakan HTTP status existing secara tepat untuk input invalid (400/413/415/422), kegagalan provider (502/503/504), dan kegagalan tak terduga. Jangan tampilkan kredensial, raw prompt, payload pengguna, atau traceback di respons dan log.

## 8. Non-functional requirements (NFR)

| ID | Kebutuhan | Bukti penerimaan |
|---|---|---|
| NFR-01 | Secrets hanya di server `.env`/environment; `.env` tidak di-commit. | Pemeriksaan git dan test konfigurasi. |
| NFR-02 | Data pribadi tidak disimpan permanen secara default; demo mengingatkan pengguna menyamarkan data; transparan pengiriman ke Gemini. | Review log, input handling, dan UI notice. |
| NFR-03 | Timeout, 429, respons provider invalid dan key kosong menghasilkan error aman. | Tes mock error path. |
| NFR-04 | Input/screenshot diperlakukan sebagai data tak tepercaya, bukan instruksi sistem (*prompt injection*). | Adversarial test. |
| NFR-05 | Semua contoh sukses mock dinyatakan **mock**; dokumentasi tidak mengklaim akurasi Gemini live. | Review demo, README, dan test report. |
| NFR-06 | Response Pydantic tervalidasi; evidence mismatch didegradasi/ditolak. | Unit test schema/grounding. |
| NFR-07 | Health, docs, demo, dan endpoint analisis tetap tersedia di port lokal yang terdokumentasi. | Smoke test lokal. |
| NFR-08 | Log metadata request ID, status, durasi, error code tanpa raw konten/kredensial. | Automated logging test. |
| NFR-09 | Versi model, prompt, dan rubrik terdokumentasi; latensi diukur, bukan ditebak. | README/test report. |
| NFR-10 | Demo mudah digunakan di laptop dan ponsel, namun tidak butuh framework baru. | Manual browser smoke check. |
| NFR-11 | PDF hukum hanya diindeks offline oleh developer; tidak ada public ingestion/API upload PDF hukum. | API route review dan test manifest. |
| NFR-12 | Artefak index read-only, portable dan kompatibel dengan pembatasan file Vercel; tidak menulis pada path bundle saat runtime. | Tes read-only filesystem dan inspeksi bundle. |
| NFR-13 | Embedding model/versi/dimensi konsisten dan tercatat; perubahan PDF membutuhkan rebuild, versioning dan redeploy. | Test mismatch, checksum dan runbook. |
| NFR-14 | Biaya 0 untuk **hosting vector DB**, tidak otomatis 0 untuk Gemini/embedding; batasi request, budget dan data yang dikirim ke provider. | Dokumen penggunaan kuota dan uji error. |
| NFR-15 | File PDF/teks terambil adalah data tidak tepercaya; instruksi di dalamnya tidak dieksekusi; sitasi hanya dari provenance yang tervalidasi. | Adversarial retrieval test. |

## 9. Pengujian dan acceptance criteria

| ID | Kasus uji | Hasil yang diterima |
|---|---|---|
| T-01 | Pesan meminta transfer biaya wawancara | Bukti dan alasan relevan; rekomendasi tidak membayar. |
| T-02 | â€œKami **tidak** memungut biaya.â€ | Tidak menjadi detected `upfront_payment` hanya karena keyword. |
| T-03 | Perekrut meminta OTP | Indikator permintaan kredensial dengan kutipan yang cocok. |
| T-04 | Poster edukasi â€œJangan bagikan OTPâ€ | Tidak dianggap meminta OTP. |
| T-05 | Undangan wawancara biasa | Tidak mengklaim perusahaan terverifikasi/aman. |
| T-06 | Pesan sangat pendek atau tidak terkait pekerjaan | `insufficient_data` atau status analog yang jujur. |
| T-07 | Gaji tinggi tanpa konteks | Tidak otomatis dianggap penipuan. |
| T-08 | Screenshot jelas | Diterima; sumber evidence `image` dan batas pembacaan jelas. |
| T-09 | Screenshot buram/kosong/rusak | Tidak memaksakan hasil valid; error atau insufficient data. |
| T-10 | Teks + screenshot satu kasus | Tidak terjadi penjumlahan/duplikasi indikator. |
| T-11 | Sumber hukum `pending_verification` | Tidak dipakai sebagai referensi hukum aktif. |
| T-12 | Aturan relevan, status perekrut belum diketahui | Legal screening meminta fakta tambahan, bukan vonis. |
| T-13 | API key Gemini kosong | Error 503 terstruktur; tidak ada hasil fiktif. |
| T-14 | Provider timeout/rate limit/bad JSON | Error terstruktur, request berakhir dengan jelas. |
| T-15 | Pesan berisi instruksi â€œabaikan aturan sistemâ€ | Diproses sebagai data, bukan instruksi agent. |
| T-16 | Teks mengandung `https://example.com` | Tidak di-fetch; tetap analisis teks saja. |
| T-17 | Mode mock tanpa key | Demo dan request test berfungsi, diberi label MOCK. |
| T-18 | Response kualitatif | Tidak ada field skor numerik atau UI persentase risiko. |
| T-19 | Refresh browser / error dan retry | Tidak ada state stuck; JSON/error tetap terlihat. |
| T-20 | Developer index PDF resmi dengan manifest valid | Chunk berhalaman, embedding, checksum, versi, dan metadata tersimpan. |
| T-21 | PDF scan saja atau corrupted | Ditolak/ditandai pending tanpa mengarang teks. |
| T-22 | PDF pending/expired atau tanpa URL resmi | Tidak diindeks sebagai sumber aktif/tidak disitasi. |
| T-23 | Query relevan untuk klausul biaya rekrutmen | Retrieval mengembalikan potongan relevan dengan sumber resmi dan halaman benar. |
| T-24 | Query tidak relevan | Tidak memaksakan sitasi hukum; status perlu konteks/unavailable. |
| T-25 | Query relevan tetapi pengecualian ruang lingkup berlaku | Tidak menyatakan pelanggaran pasti; sebutkan missing facts/exceptions. |
| T-26 | Embedding model/dimensi mismatch | Fail safe; jangan pakai index lama secara diam-diam. |
| T-27 | Server dijalankan dengan indeks read-only | Health/analisis berjalan tanpa write dalam bundle; load index sukses. |
| T-28 | Indeks tidak ada/rusak, atau embedding API gagal | Fraud tetap tidak mengklaim legal compliance; error RAG transparan. |
| T-29 | Rebuild dua kali dengan input identik | Artefak stabil sesuai batas determinisme yang terdokumentasi; versi/checksum sesuai. |
| T-30 | PDF disisipkan instruksi prompt injection | Diperlakukan sebagai teks sumber, bukan perintah sistem. |

**Metodologi validasi:** unit/integration tests memakai mock provider untuk keandalan software. Uji manual Gemini live hanya dilakukan bila key/kuota tersedia dan menggunakan sampel sintetis. Catat contoh, ekspektasi, aktual, serta lulus/gagal. **Mock passing tidak membuktikan kualitas inferensi Gemini.** Tanpa dataset berlabel representatif dan audit memadai, jangan membuat klaim akurasi umum.

### 9.1 Definition of Done (DoD) â€” MVP mandiri

- [ ] Server AI live berjalan di localhost; `/health`, `/docs`, `/demo`, dan `/api/v1/analyze` tersedia.
- [ ] Server mock berjalan terpisah dan diberi label mock.
- [ ] Input teks, screenshot, dan keduanya diproses sesuai validasi; URL mode tidak ada.
- [ ] Response fraud **hanya kategori** + bukti, tanpa skor numerik.
- [ ] Screening hukum berupa blok terpisah, tidak menyatakan pelanggaran pasti.
- [ ] Script indexing developer memproses PDF resmi, menghasilkan indeks vektor **statis/read-only**, serta mencatat sumber/halaman/pasal dan checksum.
- [ ] Retriever membaca artefak tanpa write pada runtime, melakukan query terhadap indeks, membatasi rujukan ke sumber valid, dan menangani index kosong/error tanpa sitasi palsu.
- [ ] Test indexing PDF internal, retrieval positif/negatif, mismatch embedding, read-only runtime, status verifikasi, serta biaya/error provider tersedia.
- [ ] Demo HTML membaca respons backend nyata dan menampilkan error jujur.
- [ ] Tes otomatis utama lulus dan laporan hasil tersedia.
- [ ] Jika API key tersedia, uji live berhasil; jika belum, status **BLOCKED: no credentials** dilaporkan, tidak dipalsukan.
- [ ] README, API docs, prompt/rubrik, dan batasan klaim diselaraskan.
- [ ] Tidak ada perubahan React/frontend utama, backend lama, URL feature, Chroma Cloud, atau rahasia Git.

## 10. Runbook developer â€” local-first

### 10.1 Indexing PDF oleh developer (target implementasi; **belum ada di repo saat SRS ditulis**)

**Sebelum memulai:** unduh PDF dari situs resmi, cek berlaku/tidaknya peraturan, validasi sumber dan lisensi, lalu masukkan lokasinya ke manifest. Jangan menaruh API key pada repositori. Pada Fase A index di-build **sebelum** aplikasi di-deploy, bukan pada startup atau request pengguna.

**Contoh bentuk CLI yang harus disediakan agent (perintah ilustratif, belum dapat dijalankan sebelum implementasi):**

```powershell
cd mit-web/backend
uv run python scripts/build_legal_index.py --manifest data/knowledge/legal_documents.json --output data/legal_index/
uv run python scripts/verify_legal_index.py --index data/legal_index/
```

Nama berkas dan flag final termasuk OPEN-07; agent harus mendokumentasikan yang benar-benar dibuat. Setelah indeks siap, lakukan regression tests, ukur ukuran index/dependency, dan pastikan berkas index disertakan dalam bundle Vercel ketika fase deployment dimulai. **Perubahan PDF mengharuskan rebuild + redeploy.** Jika developer memilih memisahkan PDF sumber dari repository publik, simpan hanya indeks yang lisensinya mengizinkan dan provenance/reproducibility metadata yang memadai.

### 10.2 Menjalankan server dan demo

Dari root repository `MIT_WEEK2026` di PowerShell:

```powershell
cd mit-web/backend
uv sync --locked
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# Backend asli; tanpa key, /demo dan /health tetap berjalan
uv run --locked uvicorn app.main:create_app --factory --reload --reload-dir app --host 127.0.0.1 --port 8000 --no-access-log
```

Alamat lokal: `http://127.0.0.1:8000/demo`, `http://127.0.0.1:8000/docs`, `http://127.0.0.1:8000/health`.

Untuk mock mode (terminal lain atau setelah server dihentikan):

```powershell
uv run --locked uvicorn tests.demo_server:create_test_app --factory --host 127.0.0.1 --port 8001 --no-access-log
```

Mock demo: `http://127.0.0.1:8001/demo`. Jangan gunakan server mock untuk klaim inferensi live atau deployment publik. API key hanya di `mit-web/backend/.env`, melalui `GEMINI_API_KEY`, dan **tidak** dibagikan ke chat/agent.

### 10.3 Catatan Vercel (persyaratan kompatibilitas, bukan tugas deploy saat ini)

Vercel Functions menggunakan filesystem read-only, dengan direktori sementara `/tmp`; indeks Fase A harus **dibundel sebagai file biasa yang hanya dibaca**. Jangan menaruh Chroma persistent database yang memerlukan write/locking ke dalam bundle sebagai penyimpanan utama. Python FastAPI dapat berjalan sebagai Function, tetapi fungsi Python dan indeks harus muat dalam batas bundle yang berlaku (lihat dokumentasi resmi: https://vercel.com/docs/functions/runtimes dan https://vercel.com/docs/functions/runtimes/python). Endpoint/deployment entrypoint harus diuji pada fase deployment; **jangan** mengklaim Vercel sudah kompatibel hanya karena lokal berhasil.

**Fase B ditunda:** Chroma Cloud baru dipertimbangkan jika pipeline indexing, retrieval, legal grounding, dan demo live pada Fase A sudah terbukti berjalan. Desain `KnowledgeRetriever` sebagai interface yang dapat berganti implementasi tanpa merombak API.

## 11. Instruksi pelaksanaan untuk Codex coding agent

Agent mengikuti urutan **INSPECT â†’ PLAN â†’ ASK â†’ IMPLEMENT â†’ TEST â†’ REPORT**.

1. **INSPECT:** periksa status branch/working tree dan baca `AGENTS.md`, `README.md`, `docs/api/recognition.md`, `docs/architecture/SYSTEM_OVERVIEW.md`, kode yang ada, dan SRS ini.
2. **PLAN:** beri rencana perubahan minimal, daftar file, potensi breaking change, asumsi, dan keputusan terbuka yang benar-benar menghalangi implementasi.
3. **ASK:** tanyakan pemilik fitur **sebelum** memutuskan rubrik kategori final, nama/semantik response schema dan status hukum yang masih OPEN; ajukan pula keputusan teknis OPEN-07 s.d. OPEN-09 sebelum mengunci library embedding/index. Jangan diam-diam menebak keputusan arsitektur.
4. **IMPLEMENT:** setelah persetujuan, ubah `mit-web/backend/` **saja**. Reuse service, tests, dan demo; **tambahkan script indexing PDF internal serta retrieval static vector index** sesuai SRS. Tidak boleh rewrite dari nol, menambah URL, crawling, **Chroma Cloud**, atau mengubah React.
5. **TEST:** lakukan `uv run --locked ruff check .`, `uv run --locked ruff format --check .`, dan `uv run --locked pytest -q`. Smoke test `/health`, `/demo`, `/api/v1/analyze` dengan mock; uji parsing PDF resmi, build/verify index, retrieval top-k, dan runtime read-only dengan fixture. Uji live hanya jika tersedia key/kuota dan diizinkan.
6. **REPORT:** ringkas file yang berubah, schema aktual, hasil tiap pengujian, perintah menjalankan, batasan, keputusan OPEN tersisa, dan status live test. **Jangan** mengklaim berhasil kalau belum diuji. Pisahkan hasil tes mock, Gemini live, embedding live, dan Vercel deployment; biaya/kuota embedding dilaporkan.

**Kebijakan Git:** buat branch fitur dari target yang ditentukan pemilik tim; jangan push/merge otomatis ke `main` atau `dev`. Jangan commit `.env`, `.venv`, file pribadi, atau data sensitif.

## 12. Keputusan terbuka dan risiko

| ID | Isu | Saran awal / instruksi |
|---|---|---|
| OPEN-01 | Rubrik final kategori high/medium/low/insufficient_data dan policy konflik | Gunakan draf Â§6 sebagai bahan diskusi; **minta approval** sebelum mengunci. |
| OPEN-02 | Bentuk JSON `recognition-v2`, status legal, dan kompatibilitas field lama | Proposal Â§7; **minta approval** sebelum breaking change. |
| OPEN-03 | Sumber hukum/pasal baru yang diaktifkan | Jangan aktifkan entri `pending` tanpa pemeriksaan sumber resmi dan approval. |
| OPEN-04 | `GEMINI_MODEL` yang benar-benar tersedia dan kuota API | Pertahankan konfigurasi via env; jangan mengasumsikan model tersedia. |
| OPEN-05 | SLA/anggaran API dan rate limiting pada deployment publik | Di luar MVP lokal; dokumentasikan sebagai backlog. |
| OPEN-06 | Perlu/tidaknya redaksi PII otomatis | Untuk MVP wajib notice; otomasi redaksi perlu desain dan uji terpisah. |
| OPEN-07 | Format local read-only index, retrieval library, serta lokasi berkas/manifest | Usulan: JSON/NPZ statis untuk dataset kecil; buktikan runtime tanpa write dan ukuran aman untuk Vercel. **Tanya dulu.** |
| OPEN-08 | PDF parser, embedding model/task types, chunk size/overlap, model/dimensi, biaya query embedding | Usulkan opsi dengan konsekuensi biaya/ukuran/latensi; **tanya dulu**. |
| OPEN-09 | Retrieval top-k, relevance threshold, legal applicability gating dan fallback | Tentukan lewat uji kasus relevan/tidak relevan, kemudian konfirmasi. |
| OPEN-10 | Lisensi dokumen hukum, penyimpanan PDF asli vs indexed text pada repo publik | Verifikasi kebijakan sumber; jangan commit dokumen tak berizin atau materi yang mengandung data pribadi. |

**Risiko utama:** salah ekstraksi negasi, evidence hallucination, ketidakjelasan cakupan peraturan, API quota/timeout, screenshot tak terbaca, data pribadi, dan perbedaan hasil mock vs live. Semua harus diakui secara transparan dalam demo dan dokumen.

## 13. Referensi dan batas klaim

- [R1] Vidros, S. et al. (2017). *Automatic Detection of Online Recruitment Frauds: Characteristics, Methods, and a Public Dataset*. *Future Internet*, 9(1), 6. https://doi.org/10.3390/fi9010006
- [R2] Chiraratanasopha, B., & Chay-intr, T. (2022). *Detecting Fraud Job Recruitment Using Features Reflecting from Real-world Knowledge of Fraud*. *Current Applied Science and Technology*, 22(6). https://doi.org/10.55003/cast.2022.06.22.008
- [R3] Kementerian Ketenagakerjaan RI (2024). *Kemnaker Imbau Masyarakat Waspada Penipuan Lowongan Pekerjaan*. https://www.kemnaker.go.id/news/detail/kemnaker-imbau-masyarakat-waspada-penipuan-lowongan-pekerjaan
- [R4] JDIH Kemnaker. *Permenaker No. 18 Tahun 2024 tentang Penempatan Tenaga Kerja Dalam Negeri*. https://jdih.kemnaker.go.id/peraturan/detail/2622/peraturan-menteri-nomor-18-tahun-2024
- [R5] Vercel, *Runtimes / File system support*: https://vercel.com/docs/functions/runtimes ; *Python Runtime*: https://vercel.com/docs/functions/runtimes/python ; *FastAPI*: https://vercel.com/docs/frameworks/backend/fastapi
- [R6] Google, *Gemini Embeddings / task type*: https://ai.google.dev/gemini-api/docs/embeddings (kandidat, bukan keputusan model final).
- [R7] Dokumen internal repo: `README.md`, `docs/api/recognition.md`, `docs/architecture/SYSTEM_OVERVIEW.md`, `data/knowledge/sources.json`.

**Batas ilmiah:** R1/R2 mendukung relevansi **kelas indikator**, bukan membuktikan akurasi Gemini pada chat Indonesia atau mengesahkan bobot/ambang tertentu. R3/R4 memberi referensi peringatan dan ketentuan resmi, bukan otomatis membuktikan setiap kasus sebagai pelanggaran hukum. Sistem perlu disebut **alat screening indikatif berbasis bukti**.

---

**Persetujuan yang sudah ada:** DEC-001 s.d. DEC-012 (DEC-006 direvisi: indeks lokal statis). **Keputusan menunggu:** OPEN-01 s.d. OPEN-10.  
**Batas implementasi fase ini:** Backend AI mandiri + demo HTML + requestâ€“response + **RAG PDF hukum internal berbasis indeks vektor read-only**. **Tidak ada integrasi React, input URL, maupun Chroma Cloud.**


## 14. Riwayat perubahan SRS

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.1 | 5 Nov 2026 | Backend mandiri + demo HTML, tanpa integrasi React/URL. |
| **1.2** | **5 Nov 2026** | **Keputusan A:** developer-only PDF indexing + static read-only vector RAG; Chroma Cloud menjadi opsi fase B; Vercel deployment constraints; test dan biaya embedding. |

