"""Start FastAPI and Vite together and check that the browser can reach the API."""

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import ProxyHandler, build_opener

BACKEND = Path(__file__).resolve().parents[1]
FRONTEND = BACKEND.parent / "frontend"
API_URL = "http://127.0.0.1:8000"
WEB_URL = "http://127.0.0.1:5173"


def wait_until_ready(url: str, processes: list[subprocess.Popen]) -> bool:
    opener = build_opener(ProxyHandler({}))
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline and all(p.poll() is None for p in processes):
        try:
            with opener.open(f"{url}/api/v1/health", timeout=1) as response:
                payload = json.load(response)
                if isinstance(payload, dict) and payload.get("status") == "ok":
                    return True
        except (OSError, ValueError):
            pass
        time.sleep(0.25)
    return False


def main() -> int:
    node = shutil.which("node")
    vite = FRONTEND / "node_modules/vite/bin/vite.js"
    if node is None or not vite.is_file():
        print("Pasang Node.js, lalu jalankan npm ci di folder frontend.", file=sys.stderr)
        return 1

    processes = []
    try:
        processes.append(
            subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "uvicorn",
                    "app.main:app",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    "8000",
                    "--no-access-log",
                ],
                cwd=BACKEND,
            )
        )
        if not wait_until_ready(API_URL, processes):
            print("Backend gagal dimulai. Periksa log dan port 8000.", file=sys.stderr)
            return 1
        processes.append(
            subprocess.Popen(
                [node, str(vite)],
                cwd=FRONTEND,
                env={**os.environ, "VITE_AI_API_URL": API_URL},
            )
        )
        if not wait_until_ready(WEB_URL, processes):
            print("Startup gagal. Periksa pesan di atas dan port 5173/8000.", file=sys.stderr)
            return 1
        print(f"Jeli siap di {WEB_URL}/#checker. Tekan Ctrl+C untuk berhenti.", flush=True)
        while all(p.poll() is None for p in processes):
            time.sleep(0.5)
        print("Salah satu server berhenti. Jalankan kembali Jeli.", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 0
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            process.wait()


if __name__ == "__main__":
    raise SystemExit(main())
