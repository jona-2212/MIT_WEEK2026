# Panduan Pengembangan Jeli

[Kembali ke README Jeli](../README.md)

## Prasyarat

- Git
- Node.js 22.12+ pada lini 22 atau Node.js 24, beserta npm
- `uv` dan versi Python yang ditetapkan di [`.python-version`](../mit-web/backend/.python-version)

## Instalasi dan konfigurasi

Jalankan perintah berikut di PowerShell untuk menyiapkan dependensi frontend dan menyalin template environment backend.

```powershell
git clone https://github.com/jona-2212/MIT_WEEK2026.git
cd MIT_WEEK2026/mit-web
npm --prefix frontend ci
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Isi `GEMINI_API_KEY` di `backend/.env` untuk analisis tawaran, latihan kustom, dan chat AI. Latihan bawaan dapat dijalankan dengan nilai ini dikosongkan. Gunakan `APP_ENV=development` untuk pengembangan lokal. Simpan kunci layanan di environment backend.

Konfigurasi lainnya tersedia di [template environment](../mit-web/backend/.env.example). Jika frontend mengakses API secara langsung dari origin berbeda, tambahkan origin frontend ke `ALLOWED_ORIGINS`. Endpoint sesi perekrut bertanda tangan memerlukan `ROLEPLAY_SIGNING_SECRET` minimal 32 karakter.

## Menjalankan frontend dan backend

Dari folder `mit-web`, jalankan perintah ini untuk menginstal dependensi backend sesuai lockfile dan memulai kedua server.

```powershell
uv --directory backend run --locked --no-dev python scripts/run_local.py
```

Buka [Jeli di port 5173](http://127.0.0.1:5173/) setelah aplikasi siap. Vite meneruskan permintaan API ke [FastAPI di port 8000](http://127.0.0.1:8000/docs). Tekan `Ctrl+C` untuk menghentikan keduanya.

## Referensi teknis

- [Frontend React](../mit-web/frontend/) dan [konfigurasi Vite](../mit-web/frontend/vite.config.ts)
- [Panduan backend](../mit-web/backend/README.md) dan [kontrak API](../mit-web/backend/docs/api/README.md)
- [Registry sumber regulasi](../mit-web/backend/data/knowledge/sources.json)

Ikon antarmuka menggunakan Lucide dan laporan PDF dibuat dengan jsPDF. [Lisensi Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE) · [Lisensi jsPDF](https://github.com/parallax/jsPDF/blob/master/LICENSE).
