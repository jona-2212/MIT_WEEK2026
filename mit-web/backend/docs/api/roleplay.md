# Roleplay API — roleplay-v1

Baseline: [SRS F03](../features/SRS_F03_AI_Roleplay.md), disetujui 8 November 2026.
Semua endpoint memakai prefix `/api/v1/roleplay`. Error mengikuti envelope
existing `{request_id, error: {code, message, request_id}}` dan `X-Request-ID`.

| Endpoint | Body JSON | Response |
|---|---|---|
| `GET /scenarios?lang=id\|en` | Tidak ada | Lima modul terpandu dengan pertanyaan dan opsi berbahasa ID/EN. |
| `GET /chat-scenarios?lang=id\|en` | Tidak ada | Ringkasan dua skenario chat perekrut dalam bahasa terpilih. Default `id`. |
| `POST /custom` | `{user_prompt, language?}` | Modul privat untuk halaman pemanggil. Gemini memilih pola dan menulis pengantar. Pertanyaan serta rubrik berasal dari modul terkurasi. |
| `POST /chat` | `{message, character?, language?, history?}` | Balasan Sahabat Jeli dengan `mode=live\|fallback`. Fallback memberi panduan lokal yang dilabeli UI. |
| `POST /tts` | `{text, lang?}` | 200 MP3 privat dengan `Cache-Control: no-store`, atau 204 untuk fallback browser. |
| `POST /start` | `{scenario_id, language?}` | `TurnResponse` dengan pembuka terkurasi. `language` menerima `ID` atau `EN` dan default ke `ID`. Key dan signing wajib agar sesi siap. |
| `POST /turn` | `{session_token,client_turn_id,message}` | `TurnResponse` setelah evaluasi dan respons valid; maksimal dua panggilan generatif. |

`TurnResponse`: `roleplay_version=roleplay-v1`, `mode=live|mock`, `scenario_id`,
`language`, `session_token`, `expires_at` (Unix seconds), `turn_index`, `max_turns=8`, `outcome`,
`messages`, `hint`, `report`. Produksi memakai `mode=live`; subclass server tes
saja menandai `mock`. Tidak ada fallback mock pada server biasa.

`messages`: array `{id, role: recruiter|user, text}`. `report`: `outcome`,
`skills` (code/label/status: observed|practice|unobserved), `moments`
(message_id/quote/trigger/explanation), `next_step`, `safe_reply`.

Outcome: `active`, `verified_exit`, `risky_choice`, `needs_clarification`, `stopped`.
Meminta verifikasi sendiri lalu menolak menghasilkan verified_exit; menutup
tanpa bukti verifikasi menghasilkan stopped. Menyetujui pembayaran/data sensitif
menghasilkan risky_choice di cerita, bukan bukti kejadian nyata. Ujung delapan
giliran yang belum selesai menghasilkan needs_clarification.

Content-Type harus application/json. Body dibatasi saat streaming pada 96 KiB,
pesan 1–1.000 karakter setelah trim, token maksimal 80.000 karakter,
client_turn_id 1–64 karakter ASCII alfanumerik/hyphen. Field tambahan ditolak.
Session 20 menit; token HMAC berversi harus valid. Terminal session tidak menerima
giliran baru. Jangan meletakkan token pada URL atau log.

Bahasa dikunci saat sesi dibuat dan dibaca dari token bertanda tangan pada setiap
giliran. Token dari versi awal `roleplay-v1` tanpa field `language` dibaca sebagai
`ID`. ID skenario sama di kedua katalog. Pembuka, petunjuk, dan laporan mengikuti
bahasa sesi. Pesan dan kutipan pengguna dipertahankan sebagaimana dikirim.

Error utama: 400 invalid_session, 404 scenario_not_found, 409 session_finished/
duplicate_turn, 410 session_expired, 413 request_too_large, 415 unsupported_media_type,
422 validation_error/sensitive_input, 502 roleplay_invalid_response/
roleplay_unsafe_response, 503 roleplay_not_configured/provider_not_configured/
provider_unavailable/provider_rate_limited, 504 provider_timeout.

Tidak ada endpoint finish: UI dapat mengakhiri lokal, membatalkan request dan
menggunakan report terakhir. Pesan belum dievaluasi tidak dimasukkan dalam report.
Gagal di salah satu panggilan tidak mengembalikan snapshot setengah selesai.
Retry token lama dapat memakai kuota; duplikasi terakhir terdeteksi hanya jika
klien memakai snapshot terbaru. Tidak menjamin idempotensi lintas instance.
Lihat [ADR-0005](../decisions/ADR-0005-roleplay-state.md).


Modul kustom menerima deskripsi fiktif 20–1.500 karakter dan `language` ID/EN (default ID).
Skenario kustom tidak ditambahkan ke katalog atau dipakai untuk memulai chat perekrut.
Balasan avatar dan input TTS dibatasi 600 karakter. Input avatar dibatasi 1.000 karakter
dengan paling banyak enam pesan riwayat. Endpoint TTS versi GET sudah diganti dengan POST.
Sesi baru diperlukan untuk token UUID dari versi sebelumnya.

Audio `POST /tts` memakai ElevenLabs Flash v2.5 bila kunci tersedia. Header
`X-Jeli-TTS-Provider` bernilai `elevenlabs` atau `google` pada respons MP3.
