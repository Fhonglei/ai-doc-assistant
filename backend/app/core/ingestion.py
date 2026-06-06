"""Document ingestion pipeline shared by upload and reindex endpoints."""

from app.core.chunker import chunk_document
from app.core.embedder import embed_chunks
from app.core.parser import parse_document
from app.db.metadata_store import update_document_chunk_count, update_document_status
from app.db.vector_store import add_chunks, delete_document_chunks


async def process_document_content(
    *,
    doc_id: str,
    owner_id: str,
    content: bytes,
    filename: str,
    file_type: str,
    replace_existing_chunks: bool = False,
) -> int:
    """Parse, chunk, embed, and persist a document. Returns chunk count."""
    try:
        await update_document_status(doc_id, "processing")
        if replace_existing_chunks:
            delete_document_chunks(doc_id, owner_id=owner_id)

        parsed = parse_document(content, filename, file_type)
        chunks = chunk_document(parsed)

        chunk_texts = [c.text for c in chunks]
        all_embeddings = []
        batch_size = 25
        for i in range(0, len(chunk_texts), batch_size):
            batch = chunk_texts[i:i + batch_size]
            all_embeddings.extend(await embed_chunks(batch))

        chunk_metadatas = [
            {"chunk_index": c.chunk_index, "page_number": c.page_number, "text": c.text[:500]}
            for c in chunks
        ]

        add_chunks(
            doc_id,
            chunk_texts,
            chunk_metadatas,
            all_embeddings,
            filename,
            owner_id=owner_id,
        )

        await update_document_chunk_count(doc_id, len(chunks))
        await update_document_status(doc_id, "ready")
        return len(chunks)
    except Exception as exc:
        await update_document_status(doc_id, "error", str(exc)[:500])
        raise


async def process_document_file(
    *,
    doc_id: str,
    owner_id: str,
    storage_path: str,
    filename: str,
    file_type: str,
    replace_existing_chunks: bool = False,
) -> int:
    with open(storage_path, "rb") as fh:
        content = fh.read()
    return await process_document_content(
        doc_id=doc_id,
        owner_id=owner_id,
        content=content,
        filename=filename,
        file_type=file_type,
        replace_existing_chunks=replace_existing_chunks,
    )
