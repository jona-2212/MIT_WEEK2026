# Registry spesifikasi fitur

Tujuan: menunjukkan status spesifikasi teknis sebelum implementasi, tanpa menggandakan [Product Blueprint](<../../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>).

| Fitur | Status | Acuan |
|---|---|---|
| 01 Recognition | Implementasi MVP 0.2.0; pengujian default memakai provider mock, live memerlukan key/kuota sah | [BRIEF](01-job-scam-recognition/BRIEF.md), [IMPLEMENTATION](01-job-scam-recognition/IMPLEMENTATION.md), [TEST_PLAN](01-job-scam-recognition/TEST_PLAN.md), [API](../api/recognition.md) |
| Emergency Guide, Simulator, AI Assistant, Voice | Menunggu spesifikasi terpisah sesuai urutan blueprint | [Product Blueprint](<../../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>) |

Sebelum mengimplementasikan fitur, identifikasi atau susun spesifikasinya sesuai permintaan, kemudian tinjau bersama tim. Spesifikasi harus menjelaskan tujuan/batas, input-output tervalidasi, kontrak API, perilaku deterministik dan ketidakpastian, privasi, dependency/provider, timeout/jalur gagal, sumber bila relevan, serta kriteria evaluasi dan tes. Catat status persetujuan secara eksplisit.

Brief sumber pengguna [03_BRIEF_Fitur_01_Job_Scam_Recognition_MVP.md](03_BRIEF_Fitur_01_Job_Scam_Recognition_MVP.md) dan [prompt eksekusi](../04_PROMPT_Codex_Implementasi_Fitur_01.md) dipertahankan. Entry BRIEF menautkan sumber tersebut agar tidak ada duplikasi substansial. Navigasi pembaruan mengikuti [document router](../engineering/DOCUMENT_ROUTER.md); pembagian modul mengikuti [system overview](../architecture/SYSTEM_OVERVIEW.md).
