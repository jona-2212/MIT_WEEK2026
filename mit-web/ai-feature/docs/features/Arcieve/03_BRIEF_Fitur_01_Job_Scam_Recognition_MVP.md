# PRODUCT & ENGINEERING BRIEF — Fitur 01: AI Job Scam Recognition

**Proyek:** Job Scam Guardian AI — MIT-WEEK 2026  
**Dokumen:** Brief MVP yang menjadi acuan implementasi Codex  
**Versi:** 1.0 | **Tanggal:** 31 Oktober 2026 | **Status:** Disepakati sebagai arah MVP; parameter heuristik masih perlu dievaluasi  
**Pemilik pekerjaan:** AI Engineer (FastAPI, integrasi AI, risk scoring, knowledge retrieval, pengujian API dan demo HTML).  
**Di luar kepemilikan:** Frontend produksi/UI final (tim frontend terpisah).

> **Keputusan utama:** Fitur 01 **HARUS** memiliki satu halaman web demonstrasi yang menerima **teks, gambar, atau teks + gambar sekaligus**, memprosesnya melalui FastAPI dan AI multimodal, lalu menampilkan **skor risiko 0–100, rincian perhitungan skor, indikator dan bukti, penjelasan, rekomendasi**, serta **rujukan hukum Indonesia bila sumbernya tervalidasi**. Ini bukan hanya halaman statis atau dokumentasi endpoint.

## 1. Tujuan dan masalah yang diselesaikan

Pengguna—terutama mahasiswa, fresh graduate, dan pencari kerja muda—sering menerima unggahan atau pesan tawaran kerja dan perlu memutuskan apakah ada tanda bahaya. Aplikasi membantu **menilai indikasi risiko**, bukan memvonis lowongan benar-benar scam atau menjamin lowongan aman.

**Nilai utama:** pengguna dapat memasukkan lowongan dari berbagai sumber, memahami *mengapa* terindikasi mencurigakan, melihat *bagaimana skor terbentuk*, dan mengetahui langkah verifikasi yang dapat dilakukan.

## 2. Pengalaman pengguna minimum (satu halaman demo)

### A. Form input

- **Field teks**: textarea untuk menempel isi lowongan atau percakapan perekrut.
- **Field gambar**: upload **satu** screenshot dalam format JPG/JPEG, PNG, atau WebP.
- **Ketiga pola input wajib didukung:** hanya teks; hanya gambar; dan teks **serta** gambar dalam satu analisis.
- Tampilkan pratinjau gambar atau minimal nama file; sediakan tombol untuk menghapus gambar.
- Tombol **Analisis Lowongan**, indikator loading, validasi input, status kesalahan, dan tombol analisis ulang.
- Berikan pemberitahuan sebelum submit: **samarkan nomor KTP, rekening, nomor telepon, alamat, OTP, password, dan data sensitif lainnya**. Sampaikan bahwa input akan diproses oleh penyedia AI pihak ketiga.
- Jika kedua input kosong, tampilkan validasi tanpa menghubungi AI API.

### B. Panel hasil

Wajib memperlihatkan:

1. **Risk score 0–100**, atau `—` ketika data tidak memadai; angka merupakan *skor heuristik*, **bukan probabilitas penipuan**.
2. **Risk level**: `low`, `medium`, `high`, atau `insufficient_data` disertai label Bahasa Indonesia.
3. **Breakdown skor**: indikator yang berkontribusi, masing-masing bobot, jumlah sebelum pembatasan, dan skor final (maksimum 100).
4. **Indikator risiko + evidence**: kutipan yang didukung teks/gambar, alasan singkat, dan sumber (`text`/`image`).
5. **Ringkasan dan unknowns**: apa yang diketahui dan apa yang belum dapat disimpulkan.
6. **Rekomendasi aksi** yang relevan dan aman.
7. **Konteks hukum/panduan resmi Indonesia bila tersedia dan telah diverifikasi**. Jika belum ada rujukan valid, jangan tampilkan pasal palsu atau memaksakan klaim hukum.
8. **Disclaimer**: hasil tidak membuktikan sebuah lowongan aman maupun pasti penipuan.
9. **Request ID** kecil untuk mempermudah debugging backend.

### C. Alur normal

```text
Pengguna mengisi teks dan/atau mengunggah screenshot
  -> Validasi frontend
  -> POST multipart/form-data ke FastAPI
  -> Validasi backend (panjang, jenis file, ukuran, isi gambar)
  -> Gemini multimodal API mengekstraksi data & indikasi beserta bukti (JSON terstruktur)
  -> Pydantic + pemeriksaan grounding/dukungan evidence
  -> Scoring engine Python menghitung bobot yang valid
  -> Legal knowledge retriever mengambil rujukan valid yang relevan (jika tersedia)
  -> Penyusunan penjelasan dan rekomendasi yang tidak melebih-lebihkan
  -> Respons JSON terstruktur
  -> Halaman demo menampilkan hasil lengkap
```

**Catatan:** jika teks dan gambar diberikan sekaligus, keduanya digunakan sebagai konteks **satu kasus**, bukan dua skor terpisah. Indikator yang sama **tidak boleh dihitung dua kali**.

## 3. Pembagian tanggung jawab teknis

| Komponen | Tanggung jawab |
|---|---|
| `FastAPI` | Satu pintu analisis, validasi, orkestrasi, penanganan error, response, request ID |
| `LLM vision/text (Gemini API sebagai pilihan awal)` | Membaca input, mengekstraksi indikator, menjelaskan *evidence* yang ditemukan; **bukan** menentukan skor akhir |
| `Pydantic` | Memvalidasi struktur hasil AI; menolak field/jenis nilai salah |
| `Python scoring engine` | Perhitungan skor deterministik dari indikator yang layak, termasuk batas maksimum dan breakdown |
| `Local Legal Knowledge Base` | Potongan sumber resmi terverifikasi + metadata; retrieval sederhana berdasarkan indikator |
| `Demo HTML/CSS/JS` | Form, upload, loading/error, skor dan rincian hasil; bukan frontend produk final |
| `pytest` | Unit, mocked integration, contract dan validation testing; tidak membutuhkan API key dalam CI |

**Tidak perlu:** training/fine-tuning model, GPU, LangChain, vector DB, database produksi, scraping sosial media, OCR service terpisah, chatbot, simulator, emergency guide, atau ElevenLabs untuk fitur ini.

## 4. Indikator dan scoring awal (hipotesis yang dapat disesuaikan)

| Kode | Contoh indikator | Bobot sementara |
|---|---|---:|
| `upfront_payment` | Transfer biaya rekrutmen/aktivasi sebelum proses yang dapat diverifikasi | 40 |
| `credential_request` | Meminta OTP, password, atau PIN akun | 40 |
| `premature_sensitive_data` | Meminta data sensitif terlalu dini atau tanpa konteks wajar | 20 |
| `urgency_pressure` | Desakan membayar/menyetujui segera dan melarang verifikasi | 15 |
| `unrealistic_offer` | Tawaran penghasilan/syarat tampak tidak wajar dalam konteks pekerjaan | 10 |
| `unofficial_channel` | Mengarahkan ke pihak/kanal perekrut yang tidak dapat diverifikasi dengan indikasi pendukung | 10 |

**Rumus:** `raw_score = sum(weight untuk indikator unik dengan state=detected dan evidence yang didukung input)`; `risk_score = min(100, raw_score)`.

Aturan penting:

- `detected` harus memiliki evidence; `uncertain` dan `not_detected` **tidak menambah skor**.
- Jika indikator muncul di teks sekaligus gambar, bobot ditambahkan **sekali**. Evidence boleh menyebut kedua sumber.
- **Tidak ada indikator terdeteksi ≠ lowongan terbukti aman.**
- **Data tidak cukup:** `risk_score = null`, `risk_level = insufficient_data`, jangan mengubahnya menjadi skor 0.
- Bobot dan ambang merupakan **heuristik prototipe**, belum dapat diklaim sebagai probabilitas atau akurasi ilmiah.

**Ambang sementara:** `low=0–24`, `medium=25–49`, `high=50–100`. Ambang perlu diuji pada contoh biasa, mencurigakan, dan ambigu. `low` berarti indikator yang teramati rendah, **bukan sertifikat aman**.

## 5. Legal Knowledge Base — lapisan penjelas, bukan penentu skor

Sebelumnya tim menyepakati penggunaan referensi Indonesia agar alasan AI lebih kuat. Sumber kandidat untuk **dikurasi dan diverifikasi dari dokumen resmi**:

- UU No. 13 Tahun 2003 tentang Ketenagakerjaan **beserta perubahan yang berlaku**.
- Permenaker No. 18 Tahun 2024 tentang Penempatan Tenaga Kerja Dalam Negeri.
- UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
- Perpres No. 57 Tahun 2023 tentang Wajib Lapor Lowongan Pekerjaan.
- Panduan resmi pemerintah terkait ciri lowongan palsu dan langkah verifikasi.

**Aturan:** setiap entri harus mencantumkan `source_id`, `type` (`regulation`/`official_guidance`), judul, pasal atau bagian jika ada, `official_url`, teks/ringkasan **terverifikasi**, tanggal verifikasi, catatan pengecualian, dan kode indikator terkait. Berikan kutipan pasal hanya bila benar-benar dicek dari sumber primer, bukan ingatan LLM. Jika data terverifikasi belum tersedia, kembalikan `legal_context: []` dan `legal_status: "not_available"` tanpa menghambat hasil scoring.

Jangan menganggap setiap permintaan biaya, KTP, atau penggunaan WhatsApp sebagai bukti otomatis pelanggaran hukum. Knowledge base **tidak mengubah angka risiko**.

## 6. API contract minimum

**Endpoint utama (gabungan):** `POST /api/v1/analyze` dengan `Content-Type: multipart/form-data`.

| Nama field | Jenis | Aturan |
|---|---|---|
| `text` | string, optional | Trimmed nonempty ketika ada; batas usulan 12.000 karakter |
| `file` | UploadFile, optional | JPG/JPEG/PNG/WebP; maksimum **5 MB**, periksa isi file, bukan ekstensi semata |

**Minimal salah satu harus diberikan.** Ketika keduanya diberikan, proses sebagai satu kasus. Endpoint terpisah dari dokumen lama (`/analyze/text`, `/analyze/image`) **tidak wajib dibuat**; gunakan satu endpoint ini agar form dan integrasi lebih sederhana. Bila repo telah memiliki kontrak yang dipakai frontend, jaga kompatibilitas atau dokumentasikan perubahan dan koordinasikan.

**Contoh request:** gunakan `curl -F 'text=... ' -F 'file=@screenshot.png' http://localhost:8000/api/v1/analyze` (teks dan file boleh diberikan sendiri-sendiri).

**Contoh response (ilustrasi, BUKAN hasil model aktual):**

```json
{
  "request_id": "8ed2c1d2-0000-4000-8000-0abce0ff1234",
  "status": "completed",
  "input_mode": "both",
  "analysis_version": "recognition-v1",
  "scoring_version": "rules-v1",
  "risk_score": 55,
  "risk_level": "high",
  "score_breakdown": {
    "raw_score": 55,
    "final_score": 55,
    "contributions": [
      {"code": "upfront_payment", "weight": 40},
      {"code": "urgency_pressure", "weight": 15}
    ]
  },
  "summary": "Ada permintaan biaya administrasi dan desakan waktu.",
  "indicators": [
    {
      "code": "upfront_payment",
      "state": "detected",
      "weight": 40,
      "evidence": [{"source": "text", "quote": "transfer biaya administrasi Rp150.000"}],
      "reason": "Pembayaran diminta sebelum proses rekrutmen dapat diverifikasi."
    },
    {
      "code": "urgency_pressure",
      "state": "detected",
      "weight": 15,
      "evidence": [{"source": "text", "quote": "hari ini juga"}],
      "reason": "Ada tekanan untuk segera melakukan tindakan."
    }
  ],
  "unknowns": ["Identitas perekrut belum terverifikasi secara independen."],
  "recommendations": ["Jangan transfer terlebih dahulu.", "Verifikasi melalui kanal resmi perusahaan."],
  "legal_status": "not_available",
  "legal_context": [],
  "disclaimer": "Skor ini adalah indikator heuristik, bukan persentase peluang penipuan atau jaminan keamanan."
}
```

**Untuk data tidak cukup:** pertahankan envelope serupa dengan `status: "insufficient_data"`, `risk_score: null`, `risk_level: "insufficient_data"`, `score_breakdown: {"raw_score": 0, "final_score": null, "contributions": []}`, serta alasan untuk memperbaiki input. Sebaiknya jangan membuat angka atau pasal rekaan pada kegagalan penyedia AI.

**Kesalahan HTTP yang harus ditangani:** `400` (keduanya kosong), `413` (file terlalu besar), `415` (jenis/isi gambar tidak didukung), `422` (payload invalid), `502/503/504` (provider error/tidak tersedia/timeout); respons berisi `request_id`, `error.code`, `error.message` aman, tanpa key, prompt mentah atau stack trace publik.

## 7. Quality, privasi, dan keamanan

- Tidak menyimpan input teks/gambar mentah di database atau log secara default.
- Log hanya metadata: request ID, endpoint, durasi, status, nama penyedia/model (jika tersedia), error category tanpa PII.
- Konfigurasi API key hanya pada backend melalui environment; `.env` tidak boleh masuk Git.
- Prompt injection pada iklan atau screenshot diperlakukan sebagai **konten lowongan**, bukan instruksi model.
- Lakukan validasi server-side untuk file, termasuk ukuran, MIME, dan decoding gambar. Batasi biaya dengan maksimal 1 gambar per request dan timeout.
- Bukti dari teks harus cocok dengan isi input yang dikirim; bukti dari gambar mesti didukung isi teks hasil pembacaan gambar. Jika tidak dapat dibuktikan, turunkan menjadi `uncertain` atau hilangkan dari skor.
- Jika Gemini tidak tersedia, **jangan** mengembalikan skor 'seolah AI sudah menganalisis'. Gunakan error jujur; *offline mocked examples* boleh untuk tes atau demo **hanya jika jelas diberi label simulasi**, tidak ditampilkan sebagai hasil AI sungguhan.

## 8. Test case / acceptance criteria

| ID | Skenario | Hasil yang harus ada |
|---|---|---|
| AC-01 | Hanya teks | Menampilkan skor, breakdown, indikator berbukti, dan rekomendasi |
| AC-02 | Hanya gambar valid | Isi lowongan pada gambar diproses menjadi hasil, bukan error kosong |
| AC-03 | Teks + gambar | Satu analisis gabungan, indikator sama tidak dihitung dua kali |
| AC-04 | Teks biasa tanpa red flag jelas | Tidak dinyatakan pasti aman; skor rendah hanya dengan keterbatasan eksplisit |
| AC-05 | Input sangat minim / gambar buram | `insufficient_data`, skor null, alasan yang bisa dipahami |
| AC-06 | Dua indikator terdeteksi | `raw_score` dan kontribusi mengikuti aturan deterministik |
| AC-07 | Bukti tidak ditemukan | Tidak ditambahkan ke skor; tidak mengarang quote |
| AC-08 | Input kosong / file corrupt / file oversized | Error status dan format JSON yang terprediksi |
| AC-09 | Penyedia AI timeout / auth error / rate limit | Status kegagalan jujur dan aman, tanpa bocor rahasia |
| AC-10 | Knowledge base tak tersedia atau belum terverifikasi | Hasil scoring tetap jalan; legal status jujur; tidak ada pasal rekaan |
| AC-11 | HTML demo | Pengguna bisa input, klik analisis, dan melihat hasil API nyata end-to-end |
| AC-12 | Traceability | Tests, worklog, changelog, dokumentasi API, dan perubahan signifikan tercatat |

## 9. Definition of Done Fitur 01

- [ ] Halaman HTML demo berjalan dan terhubung ke FastAPI (bukan UI statis).
- [ ] Satu endpoint menerima teks saja, gambar saja, dan keduanya dalam satu request.
- [ ] Integrasi LLM nyata dapat digunakan dengan API key yang sah dan pengaturan env.
- [ ] Pydantic validasi, bukti terikat input, dan status `insufficient_data` berfungsi.
- [ ] Python menghitung skor + breakdown konsisten dan tanpa perhitungan ganda.
- [ ] UI menampilkan 9 komponen hasil yang disyaratkan dan kondisi gagal.
- [ ] Legal context hanya memakai sumber benar-benar terverifikasi; fallback tidak mengarang rujukan.
- [ ] Unit dan mocked integration tests lulus secara lokal; hasil sesungguhnya dicatat.
- [ ] Swagger/OpenAPI, README, kontrak frontend, worklog dan changelog diperbarui.
- [ ] Tidak membocorkan API key/data sensitif pada browser atau log.

## 10. Urutan implementasi yang disarankan

1. Finalisasi satu endpoint multipart + schema response dan kontrak frontend.
2. Implementasi scoring engine terpisah dan tests deterministik.
3. Integrasi AI provider multimodal dengan output JSON terstruktur + validation dan evidence grounding.
4. Input gambar dan penanganan file; penggabungan teks+gambar.
5. Legal retrieval dari knowledge base lokal dengan referensi tervalidasi serta fallback.
6. HTML demo satu halaman lengkap + tes end-to-end berbasis API nyata.
7. Dokumentasi, worklog, ADR bila diperlukan, dan quality checks.

**Pemisahan:** frontend produksi tetap milik tim frontend; modul Roleplay, Voice, Simulator dan Emergency Guide tidak termasuk sprint Fitur 01.

---

**Catatan sumber:** Brief diselaraskan dengan Product Blueprint proyek, draft Fitur 01 v0.2, dan studi kasus MIT-WEEK 2026 yang menekankan alur fungsional live, penjelasan indikasi, perlindungan privasi, dan keterbukaan keterbatasan deteksi. Angka pembobotan dan threshold berasal dari usulan internal proyek, **bukan** data statistik yang telah divalidasi.
