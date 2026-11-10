# MIT Web

## Menjalankan semua fitur AI secara lokal

Dari folder `mit-web`, siapkan dependensi web dan konfigurasi backend sekali.

```powershell
npm --prefix frontend ci
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Isi `GEMINI_API_KEY` dan `ROLEPLAY_SIGNING_SECRET` di `backend/.env`.
Kunci sesi memerlukan minimal 32 karakter. Untuk membuat nilai acak lokal,
jalankan `uv --directory backend run --locked python -c "import secrets; print(secrets.token_urlsafe(32))"`.

Jalankan kedua server dari terminal yang sama.

```powershell
uv --directory backend run --locked python scripts/run_local.py
```

Buka [Cek Tawaran Kerja](http://127.0.0.1:5173/#checker),
[Jeli Lakon](http://127.0.0.1:5173/#simulator), atau
[Sahabat Jeli](http://127.0.0.1:5173/#avatar). Launcher menunggu `/api/v1/health`
berhasil melalui Vite sebelum menampilkan status siap. Vite meneruskan request
AI dari port 5173 ke FastAPI di port 8000. Tekan Ctrl+C untuk menghentikan keduanya.

Untuk API remote, set `VITE_AI_API_URL` ke origin API dan masukkan origin web
yang persis sama ke `ALLOWED_ORIGINS` di backend. URL loopback standar dipakai
untuk pengembangan lokal dan `npm run preview` yang berjalan di loopback.

## Deploy ke Vercel

Buat dua proyek dari repo yang sama. Tentukan domain Production masing-masing proyek sebelum mengisi variabel berikut. Gunakan URL HTTPS tanpa path.

| Proyek | Root Directory | Preset | Variabel Production |
| --- | --- | --- | --- |
| API | `mit-web/backend` | FastAPI | `APP_ENV=production`, `GEMINI_API_KEY`, `ROLEPLAY_SIGNING_SECRET`, `ALLOWED_ORIGINS=https://<domain-frontend>.vercel.app`, `LEGAL_MIN_SIMILARITY=0.70` |
| Web | `mit-web/frontend` | Vite | `VITE_AI_API_URL=https://<domain-api>.vercel.app` |

Gunakan Node.js 22.x atau 24.x untuk Web. Vercel membangun Web dengan `npm run build` dan menerbitkan `dist`. Simpan `GEMINI_API_KEY` dan `ROLEPLAY_SIGNING_SECRET` hanya di pengaturan proyek API.

Sertakan `manifest.json`, `chunks.json`, dan `vectors.json` dari `backend/data/legal_index` bersama kode pada branch yang akan dipakai Vercel. Build API memverifikasi bundle terhadap registry. Fungsi FastAPI membaca JSON tersebut saat startup dan memakai Gemini untuk embedding query yang relevan. Folder sampel, PDF sumber, dan Chroma lokal dikecualikan dari fungsi.

Ambang `0.70` dipakai untuk demo pilot Pasal 11. Contoh permintaan biaya penempatan di bawah mendapat kemiripan sekitar `0.715` dengan potongan tersebut. Filter topik dan pemeriksaan sumber tetap berlaku.

Setelah deploy, cek `/api/v1/health` di domain API. Buka URL Production Web dengan `/#checker` di jendela privat. Uji kasus biaya penempatan yang relevan dan pastikan tautan JDIH muncul. Unggah satu gambar maksimal 4 MiB pada profil Vercel.

```text
Lowongan staf gudang di Jakarta dari PT Penempatan Latih Fiktif. Sebagai PPTKS, kami memungut biaya penempatan tenaga kerja kepada pencari kerja sebesar Rp150.000 yang wajib ditransfer sebelum wawancara.
```
