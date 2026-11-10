# Indeks dokumentasi

Tujuan: menyediakan titik masuk dokumentasi produk dan engineering tanpa menggandakan sumber utama.

| Dokumen | Isi dan kapan dibaca |
|---|---|
| [Product Blueprint](<../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>) | Konteks produk, pilar, prioritas, fase, dan pembagian peran; sumber kebutuhan utama |
| [README](../README.md) | Instalasi, environment, menjalankan aplikasi, demo, tes, dan status |
| [AGENTS.md](../AGENTS.md) | Instruksi operasional agen dan workflow wajib |
| [Document router](engineering/DOCUMENT_ROUTER.md) | Kebijakan memilih dokumen yang dibaca/diperbarui |
| [System overview](architecture/SYSTEM_OVERVIEW.md) | Arsitektur fondasi yang benar-benar diimplementasikan |
| [SRS Fitur 01 v1.2](features/SRS_Jeli_F01_Backend_AI_Standalone_v1.2.md) | Kebutuhan backend mandiri, kategori kualitatif dan RAG hukum |
| [ADR-0004](decisions/ADR-0004-contextual-gemini.md) | Penilaian risiko kontekstual melalui Gemini |
| [ADR-0003](decisions/ADR-0003-qualitative-static-rag.md) | RAG statis, Chroma offline, dan pilot |
| [Runbook PDF/Chroma](engineering/LEGAL_INDEX_RUNBOOK.md) | Provenance, biaya/kuota, format indeks, build/verify/redeploy |
| [Recognition â€” API](api/recognition.md) | Multipart, ketiga contoh curl, response/error, dan integrasi frontend |
| [Laporan Fase A](reports/F01_PHASE_A_MOCK.md) | Bukti tes, smoke, mock vs live dan keterbatasan |
| [ADR-0002](decisions/ADR-0002-recognition-pipeline.md) | Keputusan arsitektur Recognition |
| [Knowledge base](../data/knowledge/README.md) | Dua sumber aktif, kandidat pending, dan verifikasi/expiry |
| [Kontrak API](api/README.md) | Endpoint, health response, request ID, CORS, dan error |
| [Development rules](engineering/DEVELOPMENT_RULES.md) | Konvensi kode, keamanan, log, dependency, dan quality gate |
| [ADR-0001](decisions/ADR-0001-project-foundation.md) | Keputusan fondasi dan konsekuensinya |
| [Template ADR](decisions/ADR-TEMPLATE.md) | Format keputusan arsitektur berikutnya |
| [Worklog](logs/WORKLOG.md) | Pekerjaan, alasan keputusan, verifikasi sebenarnya, dan tindak lanjut |
| [Changelog](../CHANGELOG.md) | Perubahan proyek yang penting menurut versi |
| [Kebijakan data](../data/README.md) | Contoh fiktif, sanitasi, dan sumber knowledge base mendatang |

Status per 5 November 2026: recognition-v2 dan tooling indeks/Chroma lokal diimplementasikan serta diuji mock; embedding/inferensi live menunggu izin kuota owner. Dokumen fitur v1 dalam arsip adalah konteks historis. Hasil mock bukan bukti kualitas inferensi atau akurasi.

