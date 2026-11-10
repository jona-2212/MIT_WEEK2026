# Deployment Jeli

Dokumentasi produk, langkah uji, dan panduan pengembangan lokal tersedia di [README utama](../README.md).

## Deploy ke Vercel

Buat dua proyek dari repo yang sama. Tentukan domain Production masing-masing proyek sebelum mengisi variabel berikut. Gunakan URL HTTPS tanpa path.

| Proyek | Root Directory | Preset | Variabel Production |
| --- | --- | --- | --- |
| API | `mit-web/backend` | FastAPI | `APP_ENV=production`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS=https://<domain-frontend>.vercel.app`, `LEGAL_MIN_SIMILARITY=0.70` |
| Web | `mit-web/frontend` | Vite | `VITE_AI_API_URL=https://<domain-api>.vercel.app` |

Gunakan Node.js 22.12+ pada lini 22 atau Node.js 24 untuk Web. Vercel membangun Web dengan `npm run build` dan menerbitkan `dist`. Simpan kunci Gemini dan kunci ElevenLabs opsional di pengaturan proyek API. Jika menggunakan endpoint sesi perekrut `/roleplay/start` dan `/roleplay/turn`, atur `ROLEPLAY_SIGNING_SECRET` minimal 32 karakter di proyek API.

Sertakan `manifest.json`, `chunks.json`, dan `vectors.json` dari `backend/data/legal_index` bersama kode pada branch yang akan dipakai Vercel. Build API memverifikasi bundle terhadap registry. Fungsi FastAPI membaca JSON tersebut saat startup dan memakai Gemini untuk embedding query yang relevan. Folder sampel, PDF sumber, dan Chroma lokal dikecualikan dari fungsi.

Ambang `0.70` dipakai untuk demo pilot Pasal 11. Pencarian juga menerapkan filter topik dan pemeriksaan sumber. Hasil bergantung pada konteks kasus dan respons penyedia.

Setelah deploy, cek `/api/v1/health` di domain API. Buka `/#simulator` di domain web dari jendela privat dan selesaikan satu skenario bawaan. Untuk memeriksa konfigurasi Gemini dan skrining hukum, buka `/#checker` dan uji contoh fiktif di bawah. Tautan JDIH dapat muncul ketika sumber terkurasi cocok dengan konteks. Uji juga satu gambar fiktif maksimal 4 MiB pada profil Vercel.

```text
Lowongan staf gudang di Jakarta dari PT Penempatan Latih Fiktif. Sebagai PPTKS, kami memungut biaya penempatan tenaga kerja kepada pencari kerja sebesar Rp150.000 yang wajib ditransfer sebelum wawancara.
```
