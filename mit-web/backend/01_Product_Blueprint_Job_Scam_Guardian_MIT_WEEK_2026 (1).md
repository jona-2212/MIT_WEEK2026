# PRODUCT BLUEPRINT — Job Scam Guardian (Nama Kerja)

**Kompetisi:** Web Development MIT-WEEK 2026  
**Versi:** 0.1 — helicopter view / product-level design  
**Status:** Dokumen penyelarasan tim, belum spesifikasi fitur dan belum implementasi  
**Fokus AI Engineer:** Backend AI, integrasi API, logika pemrosesan, evaluasi, dan pengujian endpoint.  
**Frontend utama:** Tim frontend terpisah. **Frontend demo AI:** HTML/CSS/JS minimal untuk menguji backend secara lokal.

> Nama **Job Scam Guardian** bersifat sementara. Nama final produk, tampilan antarmuka, dan pembagian akhir kepemilikan tugas ditetapkan bersama tim.

## 1. Ringkasan Eksekutif

Aplikasi web untuk membantu pelajar, mahasiswa, fresh graduate, dan pencari kerja muda di Indonesia **mengenali risiko penipuan rekrutmen, berlatih mengambil keputusan, serta mengetahui langkah aman ketika terlanjur membagikan data atau mengalami kerugian**.

Fokus produk **spesifik ke penipuan lowongan kerja** — bukan pendeteksi seluruh jenis penipuan digital. AI dipakai sebagai teknologi pendukung yang memberi alasan terstruktur, bukan hakim yang menyatakan suatu lowongan pasti legal, aman, atau scam.

**Janji nilai produk:** *Periksa tawaran kerja yang meragukan, pahami indikator risikonya, lalu ambil tindakan lebih aman.*

## 2. Kesesuaian Tema dan Studi Kasus

Tema lomba: **Guardians of the Digital Space – Empowering Today's Generation Toward a Safer Cyber Ecosystem**.

Pemetaan pendekatan:

- **Recognize:** penilaian indikasi risiko lowongan dari teks dan gambar.
- **Learn:** latihan pengambilan keputusan melalui simulasi interaksi perekrut fiktif.
- **Act:** panduan tindakan preventif dan respons darurat menurut kondisi pengguna.

Ketiganya adalah pendekatan yang dapat dikombinasikan, bukan daftar wajib. Kedalaman dan kegunaan alur pengguna lebih penting daripada jumlah fitur. Produk final harus berupa **web application yang dapat diakses melalui live deployment**, bukan sekadar demo lokal atau landing page statis.

Pada babak awal, penilaian mencakup: fungsionalitas 35%, kesesuaian studi kasus 25%, UI/UX 20%, kualitas kode 10%, dan dokumentasi 10% (menurut juknis yang disediakan).

## 3. Masalah, Pengguna, dan Nilai

**Masalah yang dituju:** Pencari kerja kesulitan mengevaluasi pesan rekrutmen mencurigakan (biaya pendaftaran, permintaan OTP/data, tekanan waktu, tawaran tak masuk akal), dan sering tidak tahu cara memverifikasi atau bertindak jika terlanjur merespons.

**Pengguna utama:** mahasiswa, fresh graduate, pencari kerja pertama kali.  
**Konteks pemakaian:** melihat postingan atau menerima chat rekrutmen → ragu → memasukkan teks atau screenshot → memahami risiko → memilih langkah berikutnya.  
**Hasil yang diinginkan:** pengguna mendapat *penjelasan yang bisa ditelusuri*, bukan sekadar skor merah/hijau.

## 4. Cakupan Kemampuan Produk

| Pilar | Modul | Apa yang dialami pengguna | Keluaran inti | Prioritas |
|---|---|---|---|---|
| Recognize | **Job Scam Recognition** | Tempel teks / unggah screenshot lowongan | Risk score indikatif, indikator dan bukti, saran verifikasi, rujukan tepercaya bila relevan | P0 |
| Act | **Emergency Action Guide** | Pilih kasus: sudah transfer, kirim KTP, klik tautan, beri kata sandi | Langkah mitigasi terurut sesuai kondisi | P0 |
| Learn | **Scam Simulator** | Hadapi perekrut fiktif dan pilih lanjut/verifikasi/berhenti | Konsekuensi pilihan dan pembelajaran | P1 |
| Pendamping | **AI Assistant / Q&A** | Tanyakan alasan hasil pemeriksaan atau langkah aman | Jawaban AI sesuai konteks kasus, bersumber jika relevan | P1 |
| Enhancement | **Voice Experience** | Berbicara dengan AI dalam simulasi atau konsultasi | Transkripsi dan balasan suara | P2 |

**Beda peran AI Assistant dan Scam Simulator:** simulator merupakan **latihan skenario** dengan tujuan dan cabang yang jelas; assistant merupakan **sesi tanya jawab** untuk menjelaskan hasil dan rekomendasi. Roleplay bebas berbasis suara adalah pengembangan lanjutan, bukan fondasi wajib agar simulator bekerja.

## 5. Alur Pengguna End-to-End

1. Pengguna membuka aplikasi, tanpa harus membuat akun.
2. Pengguna memilih **Periksa Lowongan** lalu mengirim teks atau gambar.
3. Sistem mengidentifikasi indikator, menampilkan skor **indikatif** dan bukti berupa kutipan atau bagian yang terlihat.
4. Pengguna memilih salah satu tindak lanjut:
   - **Tanya AI** untuk memperjelas risiko atau meminta langkah verifikasi.
   - **Latihan Simulasi** untuk mempraktikkan pengambilan keputusan.
   - **Saya Sudah Terlanjur** untuk memperoleh langkah mitigasi menurut situasi.
5. Pengguna pulang dengan tindakan berikutnya yang konkret, tanpa kewajiban membagikan data sensitif.

**Jalur alternatif:** pengguna yang sudah menjadi korban dapat langsung masuk ke Emergency Action Guide tanpa menjalankan analisis lowongan.

## 6. Prinsip Keputusan Produk

1. **Explanation-first:** setiap indikator harus disertai bukti input; jika bukti tidak ada, nyatakan tidak diketahui.
2. **Scoring yang konsisten:** LLM mengekstraksi indikator, Python menghitung skor berbasis aturan; bobot merupakan heuristik yang harus dievaluasi.
3. **Legal grounding secara hati-hati:** knowledge base hukum dan panduan resmi Indonesia memberikan konteks dan sumber, **bukan putusan hukum otomatis**. Pasal dikutip hanya jika benar-benar relevan dan dapat ditelusuri ke teks resmi yang berlaku.
4. **Privacy-first:** jangan mewajibkan KTP, nomor rekening, OTP, sandi, atau berkas pribadi. Ingatkan pengguna untuk menyamarkan informasi sensitif sebelum unggah. Jangan menyimpan input mentah secara default.
5. **Realistic but safe:** dataset scam berupa skenario fiktif; contoh lowongan publik disanitasi. Simulasi tidak mengirim pesan nyata ke pihak eksternal.
6. **Graceful failure:** jika AI atau TTS gagal, aplikasi masih memberikan pesan kesalahan yang jelas atau alur berbasis aturan yang tetap berguna.
7. **Feature completeness > feature count:** satu alur Recognize → saran/Act yang solid lebih berharga daripada lima modul yang rapuh.

## 7. Arsitektur Tingkat Tinggi

```text
Frontend utama (tim web)             Frontend demo minimal (AI Engineer)
              \                              /
               \      HTTP/JSON APIs        /
                         FastAPI
                [validasi + orkestrasi]
                   /      |       \
         AI multimodal   Rule engine   Knowledge retrieval
         teks + gambar   + simulator   hukum/panduan (lokal)
                   \      |       /
                   [JSON terstruktur]
                          |
                    Frontend UI

           Opsional: ElevenLabs STT/TTS via FastAPI
```

**Stack usulan:** Python 3.11+, FastAPI, Pydantic, satu penyedia LLM multimodal melalui API (pilihan awal: Gemini; dapat diganti), file JSON/Markdown untuk skenario/knowledge base, pytest + HTTP client untuk testing, ElevenLabs STT/TTS jika P2 dikerjakan.

**Tidak perlu:** training model, fine-tuning, GPU, vector database di awal, multi-agent kompleks, real-time scraping IG/LinkedIn, atau chatbot voice streaming penuh.

## 8. Batas Tanggung Jawab AI Engineer dan Tim Frontend

| Area | AI Engineer | Frontend utama |
|---|---|---|
| Logika deteksi, scoring, prompt, knowledge retrieval | **Pemilik** | Mengonsumsi hasil |
| Kontrak API, validasi, error handler, tes endpoint | **Pemilik** | Memberi masukan kebutuhan UI |
| Modul skenario dan emergency decision logic | **Pemilik backend** | Menampilkan pengalaman interaktif |
| STT/TTS API (jika dilakukan) | **Pemilik backend** | Rekam/putar audio di browser |
| HTML demo lokal, Swagger `/docs` | **Pemilik untuk test** | Tidak wajib menggunakannya |
| Desain UI final, routing, deployment frontend, responsive UX | Mendukung integrasi | **Pemilik** |
| Deployment backend & konfigurasi CORS/API URL | **Pemilik bersama tim infra/web** | Menghubungkan frontend ke endpoint |
| Keamanan kunci API | **Pemilik backend** | Tidak menaruh kunci dalam JavaScript publik |

**Penting:** frontend demo lokal bukan pengganti tautan produk live yang wajib diuji juri.

## 9. Gambaran Modul Backend

- **`api/`**: route, skema request-response, validasi.
- **`services/ai/`**: adaptor LLM multimodal dan prompt.
- **`services/risk/`**: indikator dan pembobotan deterministik.
- **`services/knowledge/`**: pencarian referensi hukum/panduan Indonesia dan metadata sumber.
- **`services/simulator/`**: skenario fiktif, state, cabang respons, feedback.
- **`services/emergency/`**: decision tree dan panduan mitigasi.
- **`services/voice/`**: STT/TTS (opsional).
- **`data/`**: contoh pengujian, metadata sumber resmi, skenario.
- **`tests/`**: unit test, contract test, integration test.
- **`demo/`**: halaman minimal untuk uji langsung.

Ini **rancangan**, bukan folder yang sudah dibuat. Struktur final diimplementasikan pada fase **Setup Environment**.

## 10. Sumber Data dan Knowledge Base

**Data evaluasi:** contoh lowongan yang wajar, contoh penipuan fiktif, serta kasus ambigu yang sengaja sulit dinilai. Pisahkan data evaluasi dari contoh yang digunakan untuk menyusun prompt/aturan.

**Knowledge base tepercaya:** dokumen hukum Indonesia terkait ketenagakerjaan, penempatan tenaga kerja, pelindungan data pribadi, dan panduan resmi lembaga terkait. Setiap kutipan disimpan bersama **judul, nomor pasal/ketentuan, tautan sumber resmi, tanggal akses/versi, dan ringkasan penerapan**. Validitas pasal dan perubahan regulasi harus diverifikasi sebelum dijadikan dasar jawaban.

**Jangan mengasumsikan:** semua lowongan bergaji besar adalah scam, semua permintaan KTP adalah ilegal, atau semua pungutan biaya memiliki status hukum yang sama.

## 11. Standar Kualitas / Definition of Done Produk

- [ ] Pengguna dapat menjalankan satu perjalanan inti mulai dari input sampai mendapat saran tindakan tanpa error.
- [ ] Backend memvalidasi teks dan gambar serta mengembalikan JSON konsisten.
- [ ] Indikator dilandasi bukti dari input; ada status ketidakpastian atau data tidak cukup.
- [ ] Risk score tidak diklaim sebagai persentase kepastian scam.
- [ ] Panduan tindakan darurat relevan menurut kondisi yang dipilih.
- [ ] API key hanya berada di backend; error/timeout API ditangani aman.
- [ ] Ada pernyataan data dapat diproses pihak ketiga jika layanan AI digunakan.
- [ ] Tes minimal mencakup kasus normal, berisiko, ambigu, input buruk, dan kegagalan penyedia API.
- [ ] Endpoint bisa dijalankan lokal dan diakses oleh frontend terpisah.
- [ ] Produk final live deployed dan dapat diuji tanpa ketergantungan ke komputer developer.
- [ ] GitHub publik, README, dokumentasi, dan video demo sesuai juknis.

## 12. Urutan Kerja yang Disepakati

### Fase A — Product Helicopter View (**saat ini**)

Output: **dokumen ini**, penyelarasan masalah, persona, modul, alur nilai, ruang lingkup, pembagian peran, arsitektur garis besar, dan prioritas MVP. Tidak perlu kode.**

### Fase B — Project Environment & Skeleton

Output: repo kerja AI, virtual environment, dependency management, struktur package, `.env.example`, `.gitignore`, FastAPI health endpoint, Swagger, CORS untuk dev, konfigurasi API key aman, baseline tests, dan satu halaman demo minimal. Di tahap ini integrasi AI dapat dibuat sebagai **stub/mocked response** agar kontrak API bisa diuji lebih cepat.

### Fase C — Spesifikasi & Implementasi per Fitur

Urutan: **01 Recognition → 02 Emergency Guide → 03 Simulator → 04 AI Assistant → 05 Voice (opsional).** Setiap fitur dikerjakan melalui dokumen spesifikasi → skema request/response → implementasi → pengujian → serah-terima frontend.

### Fase D — Integrasi dan Stabilitas

Integrasi frontend final, deploy FastAPI, konfigurasi environment produksi, pengujian alur end-to-end, dokumentasi, dan persiapan demo.

**Deadline juknis:** 10 November 2026 pukul 23.59 WITA. Jangan menjadwalkan penyelesaian modul utama pada jam-jam terakhir.

## 13. Keputusan yang Sudah Diambil vs Masih Terbuka

**Sudah disepakati / kuat dari percakapan:**
- Fokus domain pada penipuan lowongan kerja.
- Backend AI sebagai pekerjaan utama AI Engineer; frontend final terpisah.
- FastAPI, integrasi API model yang ada, bukan training sendiri.
- Input teks dan gambar untuk fitur Recognition.
- Legal knowledge base Indonesia sebagai konteks penjelasan.
- Frontend demo minimal untuk mencoba hasil kerja AI.
- Urutan kerja: helicopter view → environment → spesifikasi per fitur.

**Masih perlu divalidasi ketika masuk implementasi:**
- Nama produk dan identitas visual.
- Pilihan model/provider dan biaya/kuota API yang tersedia.
- Bobot indikator dan ambang risk score setelah evaluasi.
- Daftar regulasi/pasal yang valid dan korpus rujukan resmi.
- State simulator: disimpan sementara di memori, token sesi, atau penyimpanan sederhana.
- Pilihan hosting backend untuk akses juri, domain CORS, dan koordinasi dengan frontend.
- Kemampuan dan biaya ElevenLabs; voice tetap opsional bila membahayakan timeline.

---

*Dokumen blueprint ini menjadi induk; dokumen teknis fitur yang sudah didiskusikan tetap dipertahankan, tetapi revisi dan implementasinya dilanjutkan setelah environment project siap.*
