import json
import logging
import sys
from contextvars import ContextVar
from datetime import UTC, datetime

request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)

# Hanya metadata terpilih yang boleh masuk log aplikasi.
LOG_FIELDS = (
    "method",
    "path",
    "status_code",
    "duration_ms",
    "component",
    "error_category",
    "provider",
    "model",
    "prompt_template_version",
    "latency_ms",
    "input_tokens",
    "output_tokens",
    "success",
)


class JsonFormatter(logging.Formatter):
    def __init__(self, service: str) -> None:
        super().__init__()
        self.service = service

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, UTC)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"),
            "log_level": record.levelname,
            "event": record.getMessage(),
            "request_id": getattr(record, "request_id", request_id_context.get()),
            "service": self.service,
        }
        for field in LOG_FIELDS:
            if hasattr(record, field):
                payload[field] = getattr(record, field)
        # Pesan exception/traceback sengaja tidak diserialisasi: dapat memuat input rahasia.
        return json.dumps(payload, ensure_ascii=True, allow_nan=False)


def configure_logging(service: str, level: str) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter(service))
    logger = logging.getLogger("job_scam_guardian")
    logger.handlers.clear()
    logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False
