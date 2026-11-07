"""Entrypoint ASGI Vercel. Menggunakan factory yang sama; tidak membangun indeks."""

from app.core.config import Settings
from app.main import create_app

app = create_app(Settings(upload_profile="vercel"))
