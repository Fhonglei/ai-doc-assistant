"""Document chunking using LangChain RecursiveCharacterTextSplitter."""

from dataclasses import dataclass
from typing import List, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings
from app.core.parser import ParsedDocument, PageInfo


@dataclass
class Chunk:
    text: str
    chunk_index: int
    page_number: Optional[int] = None
    char_start: int = 0
    char_end: int = 0


def chunk_document(parsed_doc: ParsedDocument) -> List[Chunk]:
    """
    Split a parsed document into overlapping chunks.
    Uses RecursiveCharacterTextSplitter which respects paragraph/sentence boundaries.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ".", "。", " ", ""],
        length_function=len,
        is_separator_regex=False,
    )

    # Short document: return as single chunk
    if len(parsed_doc.text) < 500:
        return [
            Chunk(
                text=parsed_doc.text.strip(),
                chunk_index=0,
                page_number=parsed_doc.pages[0].page_number if parsed_doc.pages else None,
                char_start=0,
                char_end=len(parsed_doc.text),
            )
        ]

    # Build page boundary map for assigning page numbers to chunks
    page_map = _build_page_map(parsed_doc)

    split_texts = splitter.split_text(parsed_doc.text)

    chunks: List[Chunk] = []
    for i, chunk_text in enumerate(split_texts):
        # Find which page this chunk belongs to (by matching text position)
        char_start = parsed_doc.text.find(chunk_text)
        char_end = char_start + len(chunk_text) if char_start >= 0 else 0
        page_num = _find_page_for_position(char_start, page_map)

        chunks.append(
            Chunk(
                text=chunk_text.strip(),
                chunk_index=i,
                page_number=page_num,
                char_start=char_start if char_start >= 0 else 0,
                char_end=char_end,
            )
        )

    return chunks


def _build_page_map(parsed_doc: ParsedDocument) -> List[tuple[int, int]]:
    """Build a list of (char_start, page_number) for each page."""
    if not parsed_doc.pages or len(parsed_doc.pages) <= 1:
        return [(0, 1)]

    page_map = []
    current_pos = 0
    for page in parsed_doc.pages:
        page_map.append((current_pos, page.page_number))
        current_pos += len(page.text) + 2  # +2 for the "\n\n" separator
    return page_map


def _find_page_for_position(char_pos: int, page_map: List[tuple[int, int]]) -> Optional[int]:
    """Find the page number for a given character position."""
    if not page_map:
        return None

    page_num = page_map[0][1]
    for start, pg in page_map:
        if char_pos >= start:
            page_num = pg
        else:
            break
    return page_num
