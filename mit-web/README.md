# MIT Web

Proyek ini dipisahkan menjadi dua bagian:

- **Frontend**: React + TypeScript + Vite di folder `frontend`.
- **Backend**: Python FastAPI di folder `backend`.

## Menjalankan backend

```powershell
cd backend
pip install -r requirements.txt
py -m uvicorn main:app --reload --port 8000
```

Backend tersedia di `http://localhost:8000`, dengan endpoint `GET /api/data`.

## Menjalankan frontend

Di terminal lain:

```powershell
cd frontend
npm install
npm run dev
```

Frontend tersedia di `http://localhost:5173` dan mengambil pesan dari FastAPI.
URL backend dapat diubah menggunakan environment variable `VITE_API_URL`.
