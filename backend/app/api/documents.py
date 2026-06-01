"""Document upload and management endpoints."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.document import DocumentOut, DocumentListOut, DeleteResponse
from app.utils.file_utils import validate_file
from app.core.parser import parse_document
from app.core.chunker import chunk_document
from app.core.embedder import embed_chunks
from app.db.vector_store import add_chunks, delete_document_chunks
from app.db.metadata_store import (
    insert_document, get_document, list_documents,
    delete_document, update_document_status, update_document_chunk_count,
)

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "unknown"

    try:
        file_type = validate_file(content, filename)
    except ValueError as e:
        msg = str(e)
        if "FILE_TOO_LARGE" in msg:
            raise HTTPException(status_code=413, detail=msg.split(": ", 1)[1])
        raise HTTPException(status_code=400, detail=msg.split(": ", 1)[1])

    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = DocumentOut(
        id=doc_id, filename=filename, file_type=file_type,
        file_size_bytes=len(content), chunk_count=0,
        status="processing", created_at=now,
    )
    await insert_document(doc)

    try:
        parsed = parse_document(content, filename, file_type)
        chunks = chunk_document(parsed)

        # Generate embeddings (batched, using cached sentence-transformers model)
        chunk_texts = [c.text for c in chunks]
        batch_size = 25
        all_embeddings = []
        for i in range(0, len(chunk_texts), batch_size):
            batch = chunk_texts[i:i + batch_size]
            batch_embs = await embed_chunks(batch)
            all_embeddings.extend(batch_embs)

        chunk_metadatas = [
            {"chunk_index": c.chunk_index, "page_number": c.page_number, "text": c.text[:500]}
            for c in chunks
        ]

        add_chunks(doc_id, chunk_texts, chunk_metadatas, all_embeddings, filename)

        await update_document_status(doc_id, "ready")
        await update_document_chunk_count(doc_id, len(chunks))
        doc.status = "ready"
        doc.chunk_count = len(chunks)

    except Exception as e:
        await update_document_status(doc_id, "error", str(e)[:500])
        doc.status = "error"
        doc.error_message = str(e)[:500]

    return doc


@router.get("", response_model=DocumentListOut)
async def list_all_documents():
    docs = await list_documents()
    return DocumentListOut(documents=docs, total=len(docs))


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document_by_id(doc_id: str):
    doc = await get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document not found: {doc_id}")
    return doc


@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_document_by_id(doc_id: str):
    doc = await get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document not found: {doc_id}")
    deleted = delete_document_chunks(doc_id)
    await delete_document(doc_id)
    return DeleteResponse(
        success=True,
        message=f"Document '{doc.filename}' and its {deleted} chunks have been deleted.",
    )
