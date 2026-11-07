# Runbook PDF hukum, Chroma lokal, dan bundle JSON

Semua perintah dari `mit-web/ai-feature/`. Ini tooling developer, bukan fitur upload web.
PDF sumber dan database lokal diabaikan Git; jangan commit dokumen tanpa izin atau data pribadi.
Keputusan: [ADR-0003](../decisions/ADR-0003-qualitative-static-rag.md).

## Status pilot owner

- Satu PDF: `data/knowledge/pdf/2024pmnaker018.pdf`, 858.038 byte, 74 halaman.
- SHA-256: `0584ae9d0b210b119e52e1a30a06e51dd9b394eb941d43a1ff22a58e37b35b56`.
- Berkas cocok persis dengan [PDF resmi JDIH](https://jdih.kemnaker.go.id/asset/data_puu/2024pmnaker018.pdf).
- [Metadata JDIH](https://jdih.kemnaker.go.id/peraturan/detail/2622/peraturan-menteri-nomor-18-tahun-2024)
  menampilkan status Berlaku pada pemeriksaan 5 November 2026; ini bukan kesimpulan
  penerapan aturan pada kasus pengguna.
- Kurasi pilot hanya Pasal 11, halaman PDF 7: konteks PPTKS dan pengecualian jabatan
  tetap harus diverifikasi. Bagian PDF lain tidak di-embed pada pilot ini.
- Dasar pemeriksaan penggunaan teks norma: [UU 28/2014 Pasal 42 huruf b](https://jdihn.go.id/files/4/2014uu028.pdf).
  Tidak mencakup aset desain situs penerbit. Lihat catatan provenance dan manifest.
- Bundle pilot 7 November 2026 berisi 1 sumber, 1 chunk, dan vektor Gemini 768 dimensi.
  Build live memakai satu embedding dokumen dan ekspor dari koleksi Chroma
  `jeli-legal-f638276aee931cce`. Verifier mengembalikan `verified_integrity`.

## File yang perlu disediakan/diperbarui

| Lokasi | Isi |
|---|---|
| `data/knowledge/pdf/` | PDF resmi berbasis teks dari developer; pilot sudah tersedia |
| `data/knowledge/sources.json` | Registry: judul/jenis, URL, status/tanggal verifikasi, review, ringkasan, pengecualian |
| `data/knowledge/legal_documents.json` | File PDF relatif folder manifest, checksum, versi/tanggal, scope, izin, topik, fakta yang kurang, anchor/seleksi pasal |
| `.env` lokal | GEMINI_API_KEY serta model/dimensi; tidak dikirim ke browser/log/commit |
| `data/chroma_local/` | Database developer lokal; tidak dibundel Vercel |
| `data/legal_index/` | Tiga JSON hasil build/export; dibundel read-only pada deployment |

Manifest pilot sudah terisi. `validated_articles` hanya anchor heading yang benar-benar
ditinjau; `include_articles` membatasi bagian yang diindeks. Daftar kosong berarti semua
potongan dokumen dapat diindeks, tetapi pasal tanpa anchor tetap null. Jangan menebak
pasal atau menandai sumber pending sebagai verified demi melewati validasi.

Untuk dokumen baru, cocokkan PDF dengan sumber resmi dan cek versi/keberlakuan,
pengecualian, serta hak penggunaan. Jangan memperluas sumber pending tanpa review dan
approval. Perubahan sumber baru adalah perubahan korpus, bukan training/fine-tuning.

## Persiapan tanpa API/kuota

```powershell
uv run --locked python scripts/inspect_legal_pdfs.py --file 2024pmnaker018.pdf
uv run --locked python scripts/build_legal_index.py --plan --manifest data/knowledge/legal_documents.json --output data/legal_index
uv run --locked python scripts/manage_legal_chroma.py init
```

Inventaris teknis bukan verifikasi hukum. Plan menjalankan parser/chunker/gating, tidak
membuat embedding atau menulis bundle. Parser dibatasi 10 MiB, 100 halaman/PDF,
20 dokumen, 1.000 chunk, teks 100.000 karakter/halaman dan 1.000.000/dokumen;
stream konten halaman dibatasi 2 MiB sesudah dekompresi. Jalankan hanya pada PDF
developer yang telah ditinjau. pypdf dapat memerlukan memori besar sebelum hasil
dekompresi diperiksa; parser ini bukan sandbox untuk PDF arbitrer.

PDF kosong/scan/terenkripsi/rusak ditolak, termasuk halaman tak terbaca; tidak ada OCR
diam-diam. Pemeriksaan gagal tidak boleh menerbitkan sumber aktif. Indeks sebelumnya
tidak diganti oleh sumber yang gagal validasi sebelum embedding.

## Build live — hanya setelah izin kuota terpisah

**Jangan jalankan perintah berikut sebelum owner mengizinkan API.** Flag adalah
pengaman operasional, bukan pengganti persetujuan. GEMINI_API_KEY harus tersedia di
backend, model/kuota akun harus benar-benar tersedia, dan materi akan dikirim ke Google.

```powershell
uv run --locked python scripts/build_legal_index.py --allow-embedding-api --manifest data/knowledge/legal_documents.json --output data/legal_index --chroma-database data/chroma_local
uv run --locked python scripts/verify_legal_index.py --index data/legal_index
```

Alur: parsing/kurasi → embedding dokumen → simpan Chroma lokal → ekspor JSON → verify.
Chroma menerima embedding eksplisit dengan embedding_function=None; tidak mengunduh
model atau melakukan embedding ulang. Koleksi versi diberi nama dari hash indeks,
tidak melakukan reset/delete koleksi existing. Ekspor memverifikasi staging sebelum
mengganti tiga file bundle. Ekspor float32 Chroma dapat mengubah checksum vektor;
normalisasi/hash bundle dihitung ulang dan identitas model/dimensi tetap dipertahankan.

Pilot merencanakan satu HTTP embedContent untuk satu chunk. Setiap analisis dengan
query/topik/korpus aktif memerlukan paling banyak satu embedContent query selain satu
generateContent. Tidak ada retry otomatis. Biaya mengikuti kuota/tarif akun dan model;
tidak ada janji zero cost total. Jangan menguji dengan API key nyata di suite default.

## Uji jalur Chroma dengan fixture saja

```powershell
uv run --locked python scripts/build_legal_index.py --mock --manifest tests/fixtures/legal_documents.json --registry tests/fixtures/legal_sources.json --output tests/fixtures/legal_index --chroma-database .uv-cache/chroma-mock
```

Ini MOCK: PDF/vektor kosakata fixture CC0 bukan embedding semantik model. Koleksi mock
dipisahkan dan tidak boleh masuk koleksi resmi. Indeks test_fixture ditolak aplikasi
non-test. Hasil tes Chroma tidak membuktikan hasil embedding Gemini atau relevansi hukum.

## Format legal-json-v1 dan verifikasi

- `manifest.json`: purpose, model_id, dimensions, task dokumen/query, normalisasi L2,
  timestamp build, parameter chunking, jumlah chunk/halaman sumber, source snapshot,
  checksum registry/chunks/vectors, serta index_sha256.
- `chunks.json`: chunk_id deterministik, source_id, teks asli hasil parser, checksum
  teks, halaman fisik PDF mulai 1, pasal nullable.
- `vectors.json`: baris mengikuti urutan chunks, angka finite, dimensi tepat, norm L2
  mendekati satu. Tidak memakai pickle, SQLite, atau file yang dieksekusi runtime.

Checksum canonical memakai UTF-8 JSON dengan key terurut, tanpa NaN/Infinity. Identitas
konten tidak memasukkan waktu build. Build berulang mempertahankan timestamp bila
kontennya sama. Determinisme yang diuji adalah input/vektor sama; provider live tidak
dijamin mengembalikan byte vektor identik pada waktu berbeda.

Verifier membandingkan checksum registry, source snapshot, tanggal, domain HTTPS resmi,
halaman/pasal/seleksi, chunk ID/teks, jumlah, normalisasi, dan dimensi. Registry berubah
memerlukan rebuild; jangan mengedit JSON final manual. Checksum membuktikan integritas
artefak, bukan keaslian hukum tanpa proses provenance/kurasi.

Runtime memeriksa tanggal review lagi saat retrieval. Indeks yang gagal diperiksa atau
embedding yang gagal menghasilkan `reference_unavailable`. Jika skor semantik di bawah
ambang dan hanya ada satu potongan regulasi berpasal terverifikasi yang cocok dengan
topik berbukti, runtime menampilkannya sebagai rujukan awal dengan `needs_more_context`
dan warning `topic_match_only`. Cakupan dan pengecualian perlu diperiksa sebelum
menerapkan rujukan pada kasus tertentu.

## Rebuild dan Vercel

Setelah PDF/registry/parameter/model berubah: review → plan → approval kuota → rebuild
dan verify → quality gate → tinjau ukuran artifact/dependency → redeploy setelah izin.
Tidak ada scheduler indexing atau persistent write pada request/startup.

`index.py` memakai profil Vercel: gambar 4 MiB dan total multipart 4.259.840 byte.
`vercel.json` mengecualikan Chroma/PDF/dev assets dan mempertahankan JSON/prompt/demo.
Root hosting folder layanan ini. Vercel build/deployment serta ukuran bundle akhir
belum diuji; keberhasilan lokal/read-only bukan bukti deployment berhasil.
