"""ChromaDB lokal untuk developer; bukan endpoint atau database runtime Vercel."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.knowledge.chroma_store import (  # noqa: E402
    export_chroma_index,
    initialize_chroma,
    sync_index_to_chroma,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=Path("data/chroma_local"))
    command = parser.add_subparsers(dest="command", required=True)
    command.add_parser("init")
    sync = command.add_parser("sync")
    sync.add_argument("--index", type=Path, required=True)
    sync.add_argument("--registry", type=Path, default=Path("data/knowledge/sources.json"))
    sync.add_argument("--collection")
    sync.add_argument("--allow-test-fixture", action="store_true")
    export = command.add_parser("export")
    export.add_argument("--collection", required=True)
    export.add_argument("--output", type=Path, required=True)
    export.add_argument("--registry", type=Path, default=Path("data/knowledge/sources.json"))
    export.add_argument("--allow-test-fixture", action="store_true")
    args = parser.parse_args()
    try:
        if args.command == "init":
            report = initialize_chroma(args.database)
        elif args.command == "sync":
            report = sync_index_to_chroma(
                args.index,
                args.registry,
                args.database,
                allow_test=args.allow_test_fixture,
                collection_name=args.collection,
            )
        else:
            report = export_chroma_index(
                args.database,
                args.collection,
                args.output,
                args.registry,
                allow_test=args.allow_test_fixture,
            )
        print(json.dumps(report))
        return 0
    except (OSError, ValueError) as error:
        code = str(error)
        print(
            json.dumps(
                {
                    "error": code
                    if code.startswith(("chroma_", "legal_"))
                    else "chroma_operation_failed"
                }
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
