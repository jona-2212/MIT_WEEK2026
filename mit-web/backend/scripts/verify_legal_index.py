"""Verifikasi integritas bundle tanpa jaringan atau membuat embedding."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.knowledge.static_index import verify_index  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", type=Path, required=True)
    parser.add_argument("--registry", type=Path, default=Path("data/knowledge/sources.json"))
    parser.add_argument("--allow-test-fixture", action="store_true")
    args = parser.parse_args()
    try:
        manifest, chunks, _ = verify_index(
            args.index, args.registry, allow_test=args.allow_test_fixture
        )
        print(
            json.dumps(
                {
                    "status": "verified_integrity",
                    "purpose": manifest.purpose,
                    "sources": len(manifest.sources),
                    "chunks": len(chunks),
                    "dimensions": manifest.dimensions,
                    "index_sha256": manifest.index_sha256,
                    "note": (
                        "Integritas artefak; bukan verifikasi hukum atau kualitas retrieval live."
                    ),
                }
            )
        )
        return 0
    except ValueError as error:
        print(json.dumps({"error": str(error)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
