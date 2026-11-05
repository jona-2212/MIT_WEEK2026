# Document router

Tujuan: menetapkan dokumen otoritatif yang harus dibaca dan diperbarui untuk setiap kategori pekerjaan. Berlaku bersama [AGENTS.md](../../AGENTS.md).

## Peta baca dan pembaruan

| Kategori tugas | Baca terlebih dahulu | Perbarui bila terdampak |
|---|---|---|
| Kebutuhan/prioritas produk | [Product Blueprint](<../../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>) | Blueprint melalui revisi yang disepakati; registry spesifikasi terkait |
| Arsitektur atau batas modul | [System overview](../architecture/SYSTEM_OVERVIEW.md), ADR terkait | `docs/architecture/`; ADR baru untuk keputusan penting |
| Implementasi fitur | Blueprint, [feature registry](../features/README.md), spesifikasi fitur yang disetujui, ADR relevan | Spesifikasi di `docs/features/`, tes, kontrak API, dokumentasi integrasi |
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

Status saat ini: fondasi diatur oleh [ADR-0001](../decisions/ADR-0001-project-foundation.md). Fitur 01 sudah diotorisasi melalui [brief Recognition](../features/01-job-scam-recognition/BRIEF.md) dan [prompt implementasi pengguna](../04_PROMPT_Codex_Implementasi_Fitur_01.md). Baca/perbarui [implementasi](../features/01-job-scam-recognition/IMPLEMENTATION.md), [test plan](../features/01-job-scam-recognition/TEST_PLAN.md), [API Recognition](../api/recognition.md), [ADR-0002](../decisions/ADR-0002-recognition-pipeline.md), serta [metadata KB](../../data/knowledge/README.md) ketika komponennya berubah. Dokumen sumber pengguna dipertahankan; entrypoint BRIEF menautkannya tanpa menduplikasi isi.
