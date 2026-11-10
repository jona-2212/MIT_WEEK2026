# ADR-0005 — Roleplay teks dengan state bertanda tangan

8 November 2026. Status: diterima berdasarkan approval konsep F03 oleh owner.

## Keputusan

Gunakan FastAPI/HTTPX/Pydantic yang ada, tanpa dependency/agent framework baru.
Skenario berupa data Python terkurasi; HMAC SHA-256 atas JSON kanonis menjadi
state portabel antar-instance. JSON dikompresi zlib agar delapan giliran Unicode tetap kecil; dekompresi dibatasi 128 KiB dan dilakukan hanya sesudah tanda tangan valid. Backend menentukan transisi; AI hanya mengusulkan
maksud dengan bukti dan menghasilkan dialog untuk tahap terpilih. Dua panggilan
memisahkan evaluasi dari pemeran. Pembahasan dirender dari template dan bukti.

## Konsekuensi

`ROLEPLAY_SIGNING_SECRET` minimal 32 karakter, harus sama antar-instance dan
tidak boleh di frontend. Token memiliki isi terbaca, tidak dicatat/disimpan
persisten oleh aplikasi. Tidak ada jaminan exactly-once atau pembatasan kuota
global: retry token lama tetap mungkin menghabiskan kuota. Sebelum pilot publik,
konfigurasikan rate limit gateway dan budget provider. Penyimpanan server untuk
replay protection/resume merupakan keputusan berikutnya, bukan cache in-memory
yang berpura-pura konsisten di Vercel. Rotasi secret membatalkan sesi aktif.

Recognition tidak diubah. ElevenLabs ditempatkan setelah teks respons tervalidasi
untuk TTS pada fase voice; API key ElevenLabs tetap backend-only.
