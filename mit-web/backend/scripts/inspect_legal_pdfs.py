"""Inventaris PDF developer tanpa embedding/API; tidak mengaktifkan sumber hukum."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pypdf import PdfReader  # noqa: E402

from app.services.knowledge.indexing import ARTICLE, MAX_PDF_BYTES, extract_pdf, split_text  # noqa: E402
from app.services.knowledge.static_index import canonical_bytes, digest  # noqa: E402


def inspect(directory: Path, filename: str | None = None) -> dict:
    files = []
    paths = [directory / filename] if filename else sorted(directory.glob("*.pdf"))
    for path in paths:
        item = {
            "file": path.name,
            "bytes": path.stat().st_size,
            "provenance_review": "not_performed_by_inventory_tool",
        }
        try:
            if path.stat().st_size > 20 * 1024 * 1024:
                raise ValueError("pdf_inventory_size_limit")
            checksum = digest(path.read_bytes())
            reader = PdfReader(path, strict=True)
            item.update(
                {
                    "pdf_sha256": checksum,
                    "pages": len(reader.pages),
                    "encrypted": reader.is_encrypted,
                }
            )
            if path.stat().st_size > MAX_PDF_BYTES or len(reader.pages) > 100:
                item.update(
                    {
                        "parsing_status": "requires_scope_selection",
                        "reason": (
                            "PDF melampaui profil build 10 MiB/100 halaman; "
                            "tinjau bagian relevan sebelum embedding."
                        ),
                    }
                )
            else:
                pages = extract_pdf(path, checksum)
                estimated = 0
                for text in pages:
                    boundaries = [0] + [m.start() for m in ARTICLE.finditer(text)] + [len(text)]
                    parts = {
                        part
                        for start, end in zip(boundaries, boundaries[1:], strict=False)
                        for part in split_text(text[start:end], 1800, 200)
                    }
                    estimated += len(parts)
                item.update(
                    {
                        "parsing_status": "text_extracted",
                        "text_characters": sum(map(len, pages)),
                        "estimated_full_pdf_chunks": estimated,
                    }
                )
        except Exception as error:
            code = str(error)
            item["parsing_status"] = (
                code if code.startswith(("pdf_", "legal_")) else "pdf_inspection_failed"
            )
        files.append(item)
    return {
        "embedding_api_calls": 0,
        "files": files,
        "note": (
            "Inventaris teknis; bukan bukti sumber resmi, status berlaku, atau persetujuan legal."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf-dir", type=Path, default=Path("data/knowledge/pdf"))
    parser.add_argument("--report", type=Path, default=Path("data/knowledge/pdf_inventory.json"))
    parser.add_argument("--file", help="Batasi inventaris pada satu PDF pilot.")
    args = parser.parse_args()
    report = inspect(args.pdf_dir, args.file)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_bytes(canonical_bytes(report))
    print(json.dumps(report, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
