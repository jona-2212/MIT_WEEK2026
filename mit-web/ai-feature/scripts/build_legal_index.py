"""CLI internal. Tidak dipanggil web server; API embedding perlu flag eksplisit."""

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402

from app.core.config import Settings  # noqa: E402
from app.services.ai.embeddings import GeminiEmbeddingProvider  # noqa: E402
from app.services.knowledge.indexing import BuildError, build_index, prepare_index_inputs  # noqa: E402


def plan(args: argparse.Namespace) -> dict:
    sources, chunks, pages, _ = prepare_index_inputs(
        args.manifest, args.registry, chunk_size=args.chunk_size, overlap=args.overlap
    )
    settings = Settings()
    return {
        "status": "ready_awaiting_embedding_approval",
        "sources": len(sources),
        "source_pages": pages,
        "chunks": len(chunks),
        "indexed_pages": sorted({c.page_start for c in chunks}),
        "model_id": settings.embedding_model,
        "dimensions": settings.embedding_dimensions,
        "embedding_api_calls": 0,
        "planned_document_embedding_requests": len(chunks),
    }


async def run(args: argparse.Namespace) -> dict:
    if args.mock:
        from tests.legal_fixtures import MockEmbeddings

        return await build_index(
            args.manifest,
            args.registry,
            args.output,
            MockEmbeddings(),
            purpose="test_fixture",
            chunk_size=args.chunk_size,
            overlap=args.overlap,
        )
    if not args.allow_embedding_api:
        raise ValueError("embedding_api_requires_explicit_approval_flag")
    settings = Settings()
    async with httpx.AsyncClient(trust_env=False, follow_redirects=False) as client:
        return await build_index(
            args.manifest,
            args.registry,
            args.output,
            GeminiEmbeddingProvider(settings, client),
            chunk_size=args.chunk_size,
            overlap=args.overlap,
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--registry", type=Path, default=Path("data/knowledge/sources.json"))
    parser.add_argument("--output", type=Path, required=True)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--mock", action="store_true")
    mode.add_argument("--allow-embedding-api", action="store_true")
    mode.add_argument(
        "--plan", action="store_true", help="Parsing/validasi saja, tanpa API/write indeks."
    )
    parser.add_argument(
        "--chroma-database", type=Path, help="Simpan ke Chroma lokal lalu ekspor JSON."
    )
    parser.add_argument("--chunk-size", type=int, default=1800)
    parser.add_argument("--overlap", type=int, default=200)
    args = parser.parse_args()
    try:
        report = plan(args) if args.plan else asyncio.run(run(args))
        if args.chroma_database and not args.plan:
            from app.services.knowledge.chroma_store import (
                export_chroma_index,
                sync_index_to_chroma,
            )

            stored = sync_index_to_chroma(
                args.output, args.registry, args.chroma_database, allow_test=args.mock
            )
            exported = export_chroma_index(
                args.chroma_database,
                stored["collection"],
                args.output,
                args.registry,
                allow_test=args.mock,
            )
            report.update({"chroma": stored, "export": exported})
        print(json.dumps(report, ensure_ascii=False))
        return 0
    except BuildError as error:
        print(json.dumps({"error": "legal_build_rejected", "failed_sources": error.failures}))
    except (OSError, ValueError) as error:
        code = str(error)
        print(
            json.dumps(
                {
                    "error": code
                    if code.startswith(("legal_", "embedding_"))
                    else "legal_build_failed"
                }
            )
        )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
