"""File validation utilities: magic bytes, size checks, encoding detection."""

from config import settings

# Magic bytes for file type detection
MAGIC_BYTES = {
    "pdf": b"%PDF",
    "docx": b"PK\x03\x04",  # DOCX is a ZIP archive
}

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


def detect_file_type(content: bytes, filename: str) -> str | None:
    """Detect file type by magic bytes first, then fall back to extension."""
    # Magic bytes check
    if content[:4] == MAGIC_BYTES["pdf"]:
        return "pdf"
    if content[:4] == MAGIC_BYTES["docx"]:
        return "docx"

    # Extension fallback
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return "pdf"
    if lower.endswith(".docx"):
        return "docx"
    if lower.endswith(".txt"):
        return "txt"

    return None


def validate_file(content: bytes, filename: str) -> str:
    """
    Validate file type and size. Returns the detected file type.
    Raises ValueError with a structured message on failure.
    """
    # Size check
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ValueError(
            f"FILE_TOO_LARGE: File size {len(content) / (1024*1024):.1f}MB "
            f"exceeds the maximum of {settings.max_file_size_mb}MB."
        )

    # Type check
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if f".{ext}" not in ALLOWED_EXTENSIONS and ext not in {"pdf", "docx", "txt"}:
        raise ValueError(
            f"UNSUPPORTED_FILE_TYPE: File type '.{ext}' is not supported. "
            "Accepted formats: PDF, DOCX, TXT."
        )

    file_type = detect_file_type(content, filename)
    if file_type is None:
        raise ValueError(
            "UNSUPPORTED_FILE_TYPE: Could not determine file type. "
            "Accepted formats: PDF, DOCX, TXT."
        )

    return file_type


def detect_encoding(content: bytes) -> str:
    """Detect text encoding with fallback chain."""
    import chardet

    # Try UTF-8 first
    try:
        content.decode("utf-8")
        return "utf-8"
    except UnicodeDecodeError:
        pass

    # Use chardet
    result = chardet.detect(content)
    if result["encoding"] and result["confidence"] > 0.5:
        try:
            content.decode(result["encoding"])
            return result["encoding"]
        except (UnicodeDecodeError, LookupError):
            pass

    # Fallback chain
    for enc in ["gbk", "gb2312", "latin-1"]:
        try:
            content.decode(enc)
            return enc
        except (UnicodeDecodeError, LookupError):
            continue

    return "latin-1"  # Last resort
