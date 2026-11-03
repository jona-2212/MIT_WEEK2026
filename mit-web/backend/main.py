from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="MIT Web API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "status": "success",
        "message": "Backend FastAPI aktif!",
    }


@app.get("/api/data")
def read_data() -> dict[str, str]:
    return {
        "status": "success",
        "message": "Halo dari Python FastAPI!",
    }
