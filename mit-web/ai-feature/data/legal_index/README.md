# Bundle indeks resmi

Belum ada indeks hukum resmi. Developer akan menyediakan PDF dan manifest kurasi,
lalu menjalankan builder offline untuk menulis `manifest.json`, `chunks.json`, dan
`vectors.json` ke folder ini. Runtime hanya membaca ketiga file tersebut.

Jangan menyalin indeks MOCK dari `tests/fixtures/` ke folder ini untuk deployment.
Indeks yang hilang atau gagal verifikasi menghasilkan `reference_unavailable`;
health, demo, dan analisis fraud tetap dapat berjalan.

Lihat [runbook](../../docs/engineering/LEGAL_INDEX_RUNBOOK.md).
