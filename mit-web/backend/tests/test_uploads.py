from io import BytesIO

import pytest
from PIL import Image

from app.core.errors import AnalysisError
from app.services.uploads import validate_image
from tests.factories import image_bytes


def test_exif_metadata_is_not_forwarded() -> None:
    exif = Image.Exif()
    exif[0x010E] = "synthetic-private-metadata"
    original = image_bytes("JPEG", exif=exif)
    result = validate_image(original, "image/jpeg")
    with Image.open(BytesIO(result.data)) as clean:
        assert not clean.getexif()
    assert b"synthetic-private-metadata" not in result.data


def test_animated_images_are_rejected() -> None:
    output = BytesIO()
    frames = [Image.new("RGB", (20, 20), color) for color in ["red", "blue"]]
    frames[0].save(output, format="PNG", save_all=True, append_images=frames[1:], duration=100)
    with pytest.raises(AnalysisError) as exc:
        validate_image(output.getvalue(), "image/png")
    assert exc.value.status_code == 415
    assert exc.value.code == "animated_image"


def test_image_pixel_budget_is_enforced(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.uploads.MAX_IMAGE_PIXELS", 100)
    with pytest.raises(AnalysisError) as exc:
        validate_image(image_bytes(size=(20, 20)), "image/png")
    assert exc.value.status_code == 413
    assert exc.value.code == "image_dimensions_too_large"


def test_orientation_is_preserved_when_exif_is_removed() -> None:
    exif = Image.Exif()
    exif[0x0112] = 6
    result = validate_image(image_bytes("JPEG", size=(60, 20), exif=exif), "image/jpeg")
    with Image.open(BytesIO(result.data)) as clean:
        assert clean.size == (20, 60)
        assert not clean.getexif()


def test_pillow_decompression_guard_becomes_safe_413(monkeypatch: pytest.MonkeyPatch) -> None:
    data = image_bytes(size=(20, 20))
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", 100)
    with pytest.raises(AnalysisError) as exc:
        validate_image(data, "image/png")
    assert exc.value.status_code == 413
