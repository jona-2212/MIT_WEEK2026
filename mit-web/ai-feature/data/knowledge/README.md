# Knowledge base lokal

Tujuan: menyimpan metadata sumber terkurasi dan memisahkan rujukan runtime dari kandidat yang belum terverifikasi. Kebijakan data: [data/README.md](../README.md). Alur pemakaian: [implementasi Recognition](../../docs/features/01-job-scam-recognition/IMPLEMENTATION.md).

File `sources.json` dimuat secara lokal, tanpa scraping atau LLM retrieval. `source_id`, `type`, `title`, `article`, `official_url`, `summary`, `verified_at`, `review_after`, `verification_status`, `exceptions`, dan `indicator_codes` wajib mengikuti `KnowledgeEntry`. Ringkasan ditulis ulang, bukan kutipan verbatim. Flag verified merupakan hasil kurasi manusia/agen yang terdokumentasi; domain resmi saja tidak membuktikan kebenaran sebuah ringkasan.

## Hasil verifikasi 31 Oktober 2026

| ID | Jenis dan cakupan | Bukti primer / status |
|---|---|---|
| `kemnaker-recruitment-warning-2024` | Panduan, bukan pasal; terkait biaya dan penyamaran perekrut | [Siaran pers Kemnaker, 10 Oktober 2024](https://www.kemnaker.go.id/news/detail/kemnaker-imbau-masyarakat-waspada-penipuan-lowongan-pekerjaan), isi halaman dibaca |
| `permenaker-18-2024-placement-fees` | Regulasi, konteks biaya PPTKS dengan pengecualian jabatan | [PDF resmi halaman 7](https://jdih.kemnaker.go.id/asset/data_puu/2024pmnaker018.pdf#page=7), Pasal 11 ayat (1) huruf c dan ayat (2); [metadata/status JDIH](https://jdih.kemnaker.go.id/peraturan/detail/2622/peraturan-menteri-ketenagakerjaan-nomor-18-tahun-2024) menampilkan Berlaku pada tanggal pemeriksaan |

Referensi regulasi hanya menjelaskan ruang lingkup PPTKS serta pengecualian; jenis pelaksana dan penerapan pengecualian pada kasus pengguna tidak ditentukan aplikasi. Tidak ada putusan pelanggaran atau perubahan bobot skor berdasarkan referensi.

Kedua entri perlu ditinjau ulang paling lambat **31 Januari 2027**. Sesudah `review_after`, loader/retriever otomatis mengecualikan entri. Pemeriksaan tidak berjalan sebagai scheduler dan tidak melakukan verifikasi online otomatis.

## Kandidat yang dikecualikan

- UU 13/2003: perlu naskah/perubahan terkonsolidasi dan pengecualian terkait.
- UU 27/2022: hasil pencarian menemukan kandidat, tetapi URL PDF yang dibuka mengalihkan ke beranda; belum dipakai sebagai rujukan runtime.
- Perpres 57/2023: belum dilakukan kurasi pasal primer dan relevansinya terhadap indikator.

Entri pending memiliki ringkasan kosong dan tidak dikembalikan ke klien. Jangan mengisi pasal dari ingatan model. Untuk menambah rujukan, baca sumber primer serta status/perubahan, tulis ringkasan berskop jelas, simpan konteks pengecualian dan tanggal pemeriksaan, lalu uji gating melalui `tests/test_knowledge.py`. File hilang/rusak harus tetap memberi fallback aman, bukan menggagalkan scoring.
