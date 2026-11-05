# Indeks dokumentasi

Tujuan: menyediakan titik masuk dokumentasi produk dan engineering tanpa menggandakan sumber utama.

| Dokumen | Isi dan kapan dibaca |
|---|---|
| [Product Blueprint](<../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>) | Konteks produk, pilar, prioritas, fase, dan pembagian peran; sumber kebutuhan utama |
| [README](../README.md) | Instalasi, environment, menjalankan aplikasi, demo, tes, dan status |
| [AGENTS.md](../AGENTS.md) | Instruksi operasional agen dan workflow wajib |
| [Document router](engineering/DOCUMENT_ROUTER.md) | Kebijakan memilih dokumen yang dibaca/diperbarui |
| [System overview](architecture/SYSTEM_OVERVIEW.md) | Arsitektur fondasi yang benar-benar diimplementasikan |
| [Feature registry](features/README.md) | Status Fitur 01 dan fitur berikutnya |
| [Recognition — BRIEF](features/01-job-scam-recognition/BRIEF.md) | Sumber kebutuhan MVP yang diotorisasi pengguna |
| [Recognition — implementasi](features/01-job-scam-recognition/IMPLEMENTATION.md) | Pipeline, grounding, aturan skor, privasi, dan batas |
| [Recognition — API](api/recognition.md) | Multipart, ketiga contoh curl, response/error, dan integrasi frontend |
| [Recognition — test plan](features/01-job-scam-recognition/TEST_PLAN.md) | Acceptance criteria, mock vs live, dan uji demo |
| [ADR-0002](decisions/ADR-0002-recognition-pipeline.md) | Keputusan arsitektur Recognition |
| [Knowledge base](../data/knowledge/README.md) | Dua sumber aktif, kandidat pending, dan verifikasi/expiry |
| [Kontrak API](api/README.md) | Endpoint, health response, request ID, CORS, dan error |
| [Development rules](engineering/DEVELOPMENT_RULES.md) | Konvensi kode, keamanan, log, dependency, dan quality gate |
| [ADR-0001](decisions/ADR-0001-project-foundation.md) | Keputusan fondasi dan konsekuensinya |
| [Template ADR](decisions/ADR-TEMPLATE.md) | Format keputusan arsitektur berikutnya |
| [Worklog](logs/WORKLOG.md) | Pekerjaan, alasan keputusan, verifikasi sebenarnya, dan tindak lanjut |
| [Changelog](../CHANGELOG.md) | Perubahan proyek yang penting menurut versi |
| [Kebijakan data](../data/README.md) | Contoh fiktif, sanitasi, dan sumber knowledge base mendatang |

Status per 31 Oktober 2026: Fase C — Fitur 01 Recognition diimplementasikan; inferensi live memerlukan verifikasi key/kuota/model. Untuk pekerjaan baru, mulai dari router lalu baca dokumen yang berlaku; hasil mock bukan bukti akurasi/inferensi nyata dan rencana fitur lain belum menjadi implementasi.
