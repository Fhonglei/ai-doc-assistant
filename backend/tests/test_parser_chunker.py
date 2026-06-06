from app.core.chunker import chunk_document
from app.core.parser import parse_document


def test_parse_txt_detects_text_and_metadata():
    parsed = parse_document("Hello from a text file.".encode("utf-8"), "sample.txt", "txt")

    assert parsed.text == "Hello from a text file."
    assert parsed.pages[0].page_number == 1
    assert parsed.metadata["file_type"] == "txt"


def test_chunk_short_document_returns_single_chunk():
    parsed = parse_document(b"Short document.", "sample.txt", "txt")

    chunks = chunk_document(parsed)

    assert len(chunks) == 1
    assert chunks[0].chunk_index == 0
    assert chunks[0].page_number == 1
    assert chunks[0].text == "Short document."
