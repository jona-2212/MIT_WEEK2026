from dataclasses import dataclass, field
from io import BytesIO
from typing import Literal

from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import ValidationError
from starlette.datastructures import FormData, UploadFile
from starlette.formparsers import MultiPartException, MultiPartParser
from starlette.requests import ClientDisconnect, Request

from app.core.errors import AnalysisError
from app.schemas.recognition import AnalyzeInput

MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024
MAX_IMAGE_PIXELS = 16_000_000
ALLOWED_FORMATS = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


class MemoryMultipartParser(MultiPartParser):
    spool_max_size = MAX_REQUEST_BYTES + 1
    complete = False

    def on_end(self) -> None:
        self.complete = True

    async def parse(self) -> FormData:
        form = await super().parse()
        if not self.complete:
            # Parser upstream belum menolak multipart tanpa boundary penutup.
            for file in self._files_to_close_on_error:
                file.close()
            raise MultiPartException("Incomplete multipart.")
        return form


@dataclass(frozen=True)
class ValidatedImage:
    data: bytes = field(repr=False)
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]


def validate_image(
    data: bytes, mime_type: str, *, max_bytes: int = MAX_IMAGE_BYTES
) -> ValidatedImage:
    if len(data) > max_bytes:
        raise AnalysisError(413, "image_too_large", "Gambar melebihi batas profil upload.")
    if mime_type not in ALLOWED_FORMATS.values():
        raise AnalysisError(415, "unsupported_image_type", "Gunakan gambar JPEG, PNG, atau WebP.")
    try:
        with Image.open(BytesIO(data), formats=list(ALLOWED_FORMATS)) as image:
            image_format = image.format
            if ALLOWED_FORMATS.get(image_format) != mime_type:
                raise AnalysisError(415, "image_type_mismatch", "MIME dan isi gambar tidak sesuai.")
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise AnalysisError(
                    413, "image_dimensions_too_large", "Gambar maksimal 16 megapiksel."
                )
            if getattr(image, "n_frames", 1) != 1:
                raise AnalysisError(415, "animated_image", "Gunakan satu gambar statis.")
            image.verify()
        with Image.open(BytesIO(data), formats=list(ALLOWED_FORMATS)) as image:
            image.load()
            ImageOps.exif_transpose(image, in_place=True)
            # Buat gambar baru agar EXIF/GPS, komentar, dan metadata lain tidak diteruskan.
            clean = Image.new("RGBA" if "A" in image.getbands() else "RGB", image.size)
            clean.paste(image.convert(clean.mode))
            output = BytesIO()
            clean.save(output, format=image_format)
            normalized = output.getvalue()
        if len(normalized) > max_bytes:
            raise AnalysisError(
                413, "normalized_image_too_large", "Sederhanakan atau perkecil gambar."
            )
        return ValidatedImage(data=normalized, mime_type=mime_type)
    except Image.DecompressionBombError:
        raise AnalysisError(
            413, "image_dimensions_too_large", "Dimensi gambar melebihi batas aman."
        ) from None
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise AnalysisError(
            415, "invalid_image", "Isi gambar rusak atau tidak dapat dibaca."
        ) from None


async def read_analyze_form(request: Request) -> tuple[AnalyzeInput, tuple[bytes, str] | None]:
    max_request_bytes = request.app.state.settings.max_request_bytes
    max_image_bytes = request.app.state.settings.max_image_bytes
    if request.headers.get("content-type", "").split(";", 1)[0].lower() != "multipart/form-data":
        raise AnalysisError(415, "multipart_required", "Gunakan multipart/form-data.")
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            length = int(content_length)
        except ValueError:
            raise AnalysisError(
                422, "invalid_content_length", "Ukuran request tidak valid."
            ) from None
        if length < 0:
            raise AnalysisError(422, "invalid_content_length", "Ukuran request tidak valid.")
        if length > max_request_bytes:
            raise AnalysisError(413, "request_too_large", "Payload melebihi batas upload.")
    chunks = []
    total = 0
    try:
        async for chunk in request.stream():
            total += len(chunk)
            if total > max_request_bytes:
                raise AnalysisError(413, "request_too_large", "Payload melebihi batas upload.")
            chunks.append(chunk)
    except ClientDisconnect:
        raise AnalysisError(
            400, "request_incomplete", "Upload terputus. Coba kirim kembali."
        ) from None

    async def stream():
        for chunk in chunks:
            yield chunk

    parser = MemoryMultipartParser(
        request.headers, stream(), max_files=1, max_fields=1, max_part_size=48_000
    )
    # Seluruh request sudah dibatasi. Tidak ada rollover file upload ke disk.
    try:
        form = await parser.parse()
    except (MultiPartException, UnicodeError, ValueError):
        raise AnalysisError(
            422, "invalid_multipart", "Form tidak valid; kirim satu teks dan satu gambar."
        ) from None
    try:
        items = form.multi_items()
        if any(key not in {"text", "file"} for key, _ in items):
            raise AnalysisError(
                422, "unknown_form_field", "Field yang diizinkan hanya text dan file."
            )
        if len(form.getlist("text")) > 1 or len(form.getlist("file")) > 1:
            raise AnalysisError(
                422, "duplicate_form_field", "Setiap field hanya boleh dikirim sekali."
            )
        text = form.get("text", "")
        file = form.get("file")
        if not isinstance(text, str) or (file is not None and not isinstance(file, UploadFile)):
            raise AnalysisError(422, "invalid_form_field", "Tipe field text atau file tidak valid.")
        if not text.strip() and file is None:
            raise AnalysisError(400, "empty_input", "Isi teks lowongan atau pilih satu gambar.")
        try:
            validated = AnalyzeInput(text=text, has_image=file is not None)
        except ValidationError:
            raise AnalysisError(
                422, "invalid_text", "Teks maksimal 12.000 karakter setelah dirapikan."
            ) from None
        if file is None:
            return validated, None
        data = await file.read(max_image_bytes + 1)
        return validated, (data, file.content_type or "")
    finally:
        await form.close()
