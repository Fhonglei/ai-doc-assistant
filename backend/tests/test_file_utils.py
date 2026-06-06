import pytest

from app.utils.file_utils import detect_file_type, validate_file


def test_detect_file_type_prefers_magic_bytes():
    assert detect_file_type(b"%PDF-1.7 content", "report.txt") == "pdf"
    assert detect_file_type(b"PK\x03\x04content", "report.txt") == "docx"


def test_validate_file_rejects_unsupported_extension():
    with pytest.raises(ValueError, match="UNSUPPORTED_FILE_TYPE"):
        validate_file(b"hello", "image.png")


def test_validate_file_accepts_txt_by_extension():
    assert validate_file(b"hello world", "notes.txt") == "txt"
