# Document router

Tujuan: menetapkan dokumen otoritatif yang harus dibaca dan diperbarui untuk setiap kategori pekerjaan. Berlaku bersama [AGENTS.md](../../AGENTS.md).

## Peta baca dan pembaruan

| Kategori tugas | Baca terlebih dahulu | Perbarui bila terdampak |
|---|---|---|
| Kebutuhan/prioritas produk | [Product Blueprint](<../../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>) | Blueprint melalui revisi yang disepakati; registry spesifikasi terkait |
| Arsitektur atau batas modul | [System overview](../architecture/SYSTEM_OVERVIEW.md), ADR terkait | `docs/architecture/`; ADR baru untuk keputusan penting |
| Implementasi fitur | Blueprint, [SRS Fitur 01](../features/SRS_Jeli_F01_Backend_AI_Standalone_v1.2.md), ADR relevan | Spesifikasi, tes, kontrak API, dokumentasi integrasi |
| Kontrak API | [Kontrak API](../api/README.md), spesifikasi fitur, schema yang ada | `docs/api/`, Pydantic schema, OpenAPI, tes kontrak; changelog bila penting |
| Aturan development/quality | [Development rules](DEVELOPMENT_RULES.md), konfigurasi tool/CI | `docs/engineering/`, `AGENTS.md` bila aturan operasional berubah |
| Keputusan teknis signifikan | ADR sebelumnya, [template ADR](../decisions/ADR-TEMPLATE.md) | ADR baru di `docs/decisions/`; hubungkan ke arsitektur/spesifikasi |
| Pekerjaan yang dilakukan | [Worklog](../logs/WORKLOG.md) | Entri kronologis lengkap dengan hasil sebenarnya |
| Perubahan penting bagi pengguna/integrator | [Changelog](../../CHANGELOG.md), kontrak/spesifikasi terkait | `CHANGELOG.md`, catatan migrasi bila diperlukan |
| Environment/setup/dependency | [README](../../README.md), `.env.example`, `pyproject.toml`, `uv.lock` | README, template environment, lockfile, CI bila terdampak |
| Logging/error/privasi | Development rules, system overview, kontrak API | Dokumen terkait dan tes sanitasi/korelasi; ADR bila mengubah kebijakan |
| Dataset/knowledge base | [Kebijakan data](../../data/README.md), spesifikasi fitur | Metadata sumber, kebijakan data, spesifikasi dan evaluasi terkait |

## Aturan pemeliharaan

1. Selalu baca konteks dan sumber otoritatif sebelum mengubah perilaku. Jika spesifikasi fitur belum ada/disetujui, selesaikan peninjauan spesifikasi sebelum implementasi fitur.
2. Blueprint menyimpan kebutuhan produk; spesifikasi fitur menyimpan rincian teknisnya. Jangan membuat spesifikasi fitur spekulatif dalam fase fondasi.
3. Kontrak naratif di `docs/api/` harus selaras dengan Pydantic/OpenAPI dan tes. Jangan menggandakan kontrak lengkap di README.
4. Satu keputusan penting dicatat sekali dalam ADR, lalu dirujuk dokumen lain. Edit kecil tidak memerlukan ADR.
5. Setiap halaman harus menjelaskan tujuannya dan memberi tautan dokumen relevan. Tambahkan halaman baru ke [indeks](../INDEX.md).
6. Catat perubahan pekerjaan dan verifikasi di worklog. Changelog hanya merangkum perubahan penting, bukan riwayat setiap file.
7. Jika kebutuhan bertentangan, jangan mengubah blueprint diam-diam; jelaskan konflik dan cari keputusan dalam konteks permintaan pengguna. Instruksi eksplisit pengguna tetap menentukan ruang lingkup pekerjaan.

Status 5 November 2026: spesifikasi Fitur 01 terbaru adalah [SRS v1.2](../features/SRS_Jeli_F01_Backend_AI_Standalone_v1.2.md), dengan keputusan [ADR-0003](../decisions/ADR-0003-qualitative-static-rag.md), [API](../api/recognition.md), dan [runbook PDF/Chroma](LEGAL_INDEX_RUNBOOK.md). Dokumen fitur v1 dipindah tim ke arsip; jangan memulihkan path lama atau menimpa perubahan tim. Blueprint dan ADR lama adalah konteks historis, bukan pengganti kontrak kualitatif yang telah disetujui.
