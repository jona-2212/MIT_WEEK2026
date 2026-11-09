# SRS F03 — Jeli Lakon

Disetujui pemilik proyek pada 8 November 2026 melalui instruksi “yes implement”.
Baseline: [konsep v0.1](CONCEPT_F03_AI_Roleplay_Jeli_v0.1.md). Persetujuan mencakup
implementasi teks dan pengujian mock; tidak mencakup request AI live atau deployment.

- Dua skenario ID/EN: deposit seragam dan komisi tugas, balasan bebas, maksimal 8 giliran.
- Backend menafsirkan tindakan dan memvalidasi kutipan, memilih tahap, kemudian
  meminta pemeran menulis satu respons sesuai tahap. Maksimal dua panggilan/turn,
  total timeout 40 detik. Terminal state tidak memanggil pemeran.
- HMAC SHA-256 menandatangani state berversi, masa berlaku 20 menit, disimpan hanya
  dalam memori browser. Token tidak terenkripsi dan replay belum dicegah global.
- Maksimal 1.000 karakter/pesan, 600 karakter/respons, body JSON maksimal 96 KiB.
- Rubrik kualitatif: memeriksa proses, verifikasi mandiri, melindungi uang/data,
  menetapkan batas. Kutipan harus persis cocok; ambiguitas tidak diberi penalti.
- Awal, petunjuk, akhir lokal dan pembahasan template tidak memanggil model.
- Pesan sensitif yang terdeteksi ditolak sebelum AI. Deteksi merupakan heuristik,
  bukan jaminan redaksi. Tidak ada transaksi, kontak operasional, upload atau voice.
- UI: briefing, bantuan draf yang dapat diedit, riwayat chat, petunjuk tahap,
  berhenti kapan saja, dan pembahasan. Browser menyimpan sesi terpisah per bahasa
  di memori sampai meninggalkan halaman. Request lama dibatalkan setelah ganti
  bahasa, akhir latihan, reset, atau unmount.
- Key kosong tidak mematikan startup/health; roleplay mengembalikan 503 yang jujur.
- API dan error mengikuti [kontrak roleplay](../api/roleplay.md).
- Tes mencakup transisi, negasi/ketidakpastian, token/expiry, limit body,
  provider gagal, grounding, terminal, dan regresi Recognition. Default tanpa AI live.

ElevenLabs disiapkan sebagai rencana TTS (balasan Gemini → suara); STT opsional
untuk input mikrofon. Keduanya fase lanjutan, bukan dependency teks.

## Pembaruan dua mode

Jeli Lakon menawarkan latihan terpandu ID/EN dan chat perekrut teks. Lima modul
bawaan memiliki rubrik tetap dan laporan PDF. Untuk kasus kustom, Gemini memilih
modul yang relevan dan menulis konteks fiktif. Rubrik tetap berasal dari modul
terkurasi, dan kasus kustom disimpan di halaman pemanggil. Chat perekrut mengunci
bahasa sesi saat mulai, termasuk untuk pembuka, petunjuk, dan pembahasan.

Sahabat Jeli adalah halaman avatar terpisah dengan input teks atau pengenalan
suara browser. Balasan memakai Gemini atau panduan lokal berlabel saat provider
gagal. Audio melalui POST privat ke backend dan suara browser menjadi fallback.
Lihat [kontrak Roleplay](../api/roleplay.md).
