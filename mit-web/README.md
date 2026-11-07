# MIT Web

## Demo lokal Cek Tawaran Kerja

Jalankan perintah berikut dari `mit-web` untuk menyiapkan FastAPI AI.

```powershell
cd ai-feature
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Isi `GEMINI_API_KEY` di `ai-feature/.env` dengan kredensial Gemini proyek, lalu jalankan FastAPI dari folder `ai-feature`.

```powershell
$env:ALLOWED_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
$env:LEGAL_MIN_SIMILARITY = '0.70'
uv run --locked python -m uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

Di terminal lain, dari `mit-web`, jalankan frontend React.

```powershell
cd frontend
npm ci
$env:VITE_AI_API_URL = 'http://127.0.0.1:8000'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Buka [Cek Tawaran Kerja](http://127.0.0.1:5173/#checker). Tempel teks atau unggah screenshot, lalu pilih **Analisis Tawaran**. Jika indeks hukum resmi belum tersedia, analisis yang berhasil akan menampilkan `reference_unavailable` pada bagian referensi hukum.

## Deploy ke Vercel

Buat dua proyek dari repo yang sama. Tentukan domain Production masing-masing proyek sebelum mengisi variabel berikut. Gunakan URL HTTPS tanpa path.

| Proyek | Root Directory | Preset | Variabel Production |
| --- | --- | --- | --- |
| API | `mit-web/ai-feature` | FastAPI | `APP_ENV=production`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS=https://<domain-frontend>.vercel.app`, `LEGAL_MIN_SIMILARITY=0.70` |
| Web | `mit-web/frontend` | Vite | `VITE_AI_API_URL=https://<domain-api>.vercel.app` |

Gunakan Node.js 22.x atau 24.x untuk Web. Vercel membangun Web dengan `npm run build` dan menerbitkan `dist`. Simpan `GEMINI_API_KEY` hanya di pengaturan proyek API.

Sertakan `manifest.json`, `chunks.json`, dan `vectors.json` dari `ai-feature/data/legal_index` bersama kode pada branch yang akan dipakai Vercel. Build API memverifikasi bundle terhadap registry. Fungsi FastAPI membaca JSON tersebut saat startup dan memakai Gemini untuk embedding query yang relevan. Folder sampel, PDF sumber, dan Chroma lokal dikecualikan dari fungsi.

Ambang `0.70` dipakai untuk demo pilot Pasal 11. Contoh permintaan biaya penempatan di bawah mendapat kemiripan sekitar `0.715` dengan potongan tersebut. Filter topik dan pemeriksaan sumber tetap berlaku.

Setelah deploy, cek `/api/v1/health` di domain API. Buka URL Production Web dengan `/#checker` di jendela privat. Uji kasus biaya penempatan yang relevan dan pastikan tautan JDIH muncul. Unggah satu gambar maksimal 4 MiB pada profil Vercel.

```text
Lowongan staf gudang di Jakarta dari PT Penempatan Latih Fiktif. Sebagai PPTKS, kami memungut biaya penempatan tenaga kerja kepada pencari kerja sebesar Rp150.000 yang wajib ditransfer sebelum wawancara.
```

## Backend lama

Jalankan dari `mit-web` jika perlu mengakses endpoint lama seperti `GET /api/data`. Gunakan port berbeda jika FastAPI AI sedang berjalan.

```powershell
cd backend
pip install -r requirements.txt
py -m uvicorn main:app --reload --port 8000
```
