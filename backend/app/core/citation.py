"""Citation parsing: extract [N] markers from LLM output, map to sources."""

import re
from typing import List
from app.core.retriever import ChunkWithScore
from app.models.chat import Source


def extract_sources(answer: str, chunks: List[ChunkWithScore]) -> List[Source]:
    """
    Parse [N] citation markers from the answer text and map them to chunk metadata.
    Returns deduplicated, ordered Source list.
    """
    # Find all citation markers
    markers = re.findall(r"\[(\d+)\]", answer)
    unique_markers = set(int(m) for m in markers)

    sources: List[Source] = []
    seen_doc_chunk = set()

    for marker in sorted(unique_markers):
        # Markers are 1-based in the prompt
        idx = marker - 1
        if 0 <= idx < len(chunks):
            chunk = chunks[idx]
            key = (chunk.document_id, chunk.chunk_index)
            if key not in seen_doc_chunk:
                seen_doc_chunk.add(key)
                sources.append(
                    Source(
                        document_id=chunk.document_id,
                        document_name=chunk.document_name,
                        chunk_index=chunk.chunk_index,
                        text=chunk.text,
                        relevance_score=chunk.relevance_score or chunk.similarity_score,
                        page_number=chunk.page_number,
                    )
                )

    return sources
