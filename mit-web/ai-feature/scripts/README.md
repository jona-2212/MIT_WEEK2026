# Tooling developer Fitur 01

Jalankan dari root layanan. Tidak ada script yang dipanggil endpoint pengguna.

| Script | Efek |
|---|---|
| inspect_legal_pdfs.py | Membaca PDF lokal dan menulis inventaris teknis, tanpa embedding/API |
| build_legal_index.py --plan | Parsing, chunking, gating dan jumlah request yang direncanakan; tanpa API/write indeks |
| build_legal_index.py --mock | Build bundle dari fixture dan embedding MOCK, bukan sumber hukum |
| build_legal_index.py --allow-embedding-api | Build dengan API Gemini; hanya setelah izin kuota terpisah |
| verify_legal_index.py | Membaca/verifikasi integritas bundle tanpa jaringan |
| manage_legal_chroma.py init | Membuat koleksi Chroma lokal kosong, tanpa default embedding |
| manage_legal_chroma.py sync | Menyimpan vektor yang sudah dibuat ke koleksi lokal versi hash |
| manage_legal_chroma.py export | Membuat ekspor JSON, memverifikasi staging sebelum publikasi file |

Opsi --chroma-database pada builder menghubungkan build → Chroma → ekspor JSON dalam
satu perintah developer. Tidak ada CloudClient/HTTP server Chroma, reset/delete koleksi,
atau embedding ulang oleh Chroma. Telemetry anonim dinonaktifkan.

[Runbook](../docs/engineering/LEGAL_INDEX_RUNBOOK.md) memuat perintah sebenarnya,
format/provenance, biaya/kuota, batas ukuran/halaman, rebuild, dan batas kesiapan Vercel.
Key hanya dari Settings/.env backend; jangan menambahkan ke argumen CLI atau log.
