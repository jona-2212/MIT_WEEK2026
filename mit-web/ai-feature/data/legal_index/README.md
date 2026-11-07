# Bundle indeks resmi

Bundle pilot memuat satu potongan dari Permenaker 18/2024 Pasal 11. Builder menulis
`manifest.json`, `chunks.json`, dan `vectors.json` ke folder ini. Sertakan ketiganya
saat menyiapkan deployment. Runtime membaca bundle saat startup.

Jangan menyalin indeks MOCK dari `tests/fixtures/` ke folder ini untuk deployment.
Indeks yang hilang atau gagal verifikasi menghasilkan `reference_unavailable`;
health, demo, dan analisis fraud tetap dapat berjalan.

Lihat [runbook](../../docs/engineering/LEGAL_INDEX_RUNBOOK.md).
