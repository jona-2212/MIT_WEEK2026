# Registry hukum dan pilot PDF

`sources.json` adalah registry kurasi, bukan korpus RAG sendiri. Runtime hanya
mengembalikan potongan PDF dari bundle JSON yang lolos checksum, halaman/pasal,
status/tanggal review, domain HTTPS resmi, topik, cakupan, dan pengecualian.

Pilot owner pada 5 November 2026 adalah **satu PDF** `pdf/2024pmnaker018.pdf`.
Checksum cocok byte-per-byte dengan [sumber JDIH](https://jdih.kemnaker.go.id/asset/data_puu/2024pmnaker018.pdf).
[Metadata resmi](https://jdih.kemnaker.go.id/peraturan/detail/2622/peraturan-menteri-nomor-18-tahun-2024)
menampilkan Berlaku saat diperiksa. Manifest memilih hanya Pasal 11 halaman PDF 7,
termasuk pengecualiannya; penerapan pada kasus tetap memerlukan fakta jenis pelaksana
dan jabatan. [Provenance](pilot_provenance.json) menyimpan hasil pemeriksaan teknis.
PDF lain di folder developer tidak masuk manifest pilot.

Embedding Gemini untuk pilot belum dibuat karena owner memilih menunggu izin kuota.
ChromaDB lokal telah disiapkan untuk developer dengan koleksi resmi kosong; runtime
Vercel tetap memakai ekspor JSON read-only. Tidak ada public upload PDF atau Chroma Cloud.

## Status registry

- `permenaker-18-2024-placement-fees`: sumber existing verified, diperiksa ulang 5 November
  2026; hanya bagian terkurasi pada manifest yang dapat disitasi.
- `kemnaker-recruitment-warning-2024`: metadata panduan hasil kurasi sebelumnya, belum
  menjadi PDF pada korpus pilot sehingga tidak otomatis diretrieval.
- UU 13/2003, UU 27/2022 dan Perpres 57/2023 tetap pending/nonaktif; tidak diaktifkan
  hanya karena nama dokumen atau file tersedia.

Domain resmi saja tidak memvalidasi isi ringkasan. Metadata wajib menyimpan status,
tanggal verifikasi/review, konteks, dan pengecualian. Pasal tanpa anchor yang ditinjau
tetap null; referensi berbasis halaman masih dapat dipakai bila kurasi memadai.
Sesudah review_after, sumber dikecualikan. Tidak ada pemeriksaan online otomatis.

Tambah/perbarui sumber melalui proses developer pada [runbook](../../docs/engineering/LEGAL_INDEX_RUNBOOK.md).
Checksum atau registry berubah membutuhkan rebuild dan redeploy, bukan edit JSON
akhir manual. Jangan menandai sumber pending sebagai verified tanpa pemeriksaan.
