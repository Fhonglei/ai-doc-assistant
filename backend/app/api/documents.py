"""Document upload and management endpoints."""

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File, HTTPException

from app.core.auth import UserContext, get_current_user
from app.models.document import (
    BulkDeleteRequest,
    DeleteResponse,
    DocumentChunksOut,
    DocumentListOut,
    DocumentOut,
    DocumentRenameRequest,
)
from app.utils.file_utils import validate_file
from app.core.ingestion import process_document_file
from app.db.vector_store import (
    delete_document_chunks,
    get_document_chunks,
    rename_document_chunks,
)
from app.db.metadata_store import (
    insert_document, get_document, list_documents,
    delete_document, get_document_storage_path, rename_document,
)
from config import settings

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


def _safe_filename(filename: str) -> str:
    return Path(filename or "unknown").name.strip() or "unknown"


def _storage_path(doc_id: str, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return str(upload_dir / f"{doc_id}{ext}")


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: UserContext = Depends(get_current_user),
):
    content = await file.read()
    filename = _safe_filename(file.filename or "unknown")

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
    storage_path = _storage_path(doc_id, filename)
    with open(storage_path, "wb") as fh:
        fh.write(content)

    await insert_document(doc, owner_id=user.user_id, storage_path=storage_path)
    background_tasks.add_task(
        process_document_file,
        doc_id=doc_id,
        owner_id=user.user_id,
        storage_path=storage_path,
        filename=filename,
        file_type=file_type,
    )

    return doc


@router.get("", response_model=DocumentListOut)
async def list_all_documents(user: UserContext = Depends(get_current_user)):
    docs = await list_documents(user.user_id)
    return DocumentListOut(documents=docs, total=len(docs))


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document_by_id(doc_id: str, user: UserContext = Depends(get_current_user)):
    doc = await get_document(doc_id, user.user_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document not found: {doc_id}")
    return doc


@router.patch("/{doc_id}", response_model=DocumentOut)
async def rename_document_by_id(
    doc_id: str,
    request: DocumentRenameRequest,
    user: UserContext = Depends(get_current_user),
):
    filename = _safe_filename(request.filename)
    if not filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty.")

    doc = await rename_document(doc_id, user.user_id, filename)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document not found: {doc_id}")
    rename_document_chunks(doc_id, user.user_id, filename)
    return doc


@router.post("/{doc_id}/reindex", response_model=DocumentOut)
async def reindex_document_by_id(
    doc_id: str,
    background_tasks: BackgroundTasks,
    user: UserContext = Depends(get_current_user),
):
    doc = await get_document(doc_id, user.user_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document not found: {doc_id}")

    storage_path = await get_document_storage_path(doc_id, user.user_id)
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(status_code=409, detail="Original file is not available for reindexing.")

    background_tasks.add_task(
        process_document_file,
        doc_id=doc_id,
        owner_id=user.user_id,
        storage_path=storage_path,
        filename=doc.filename,
        file_type=doc.file_type,
        replace_existing_chunks=True,
    )
    doc.status = "processing"
    return doc


@router.get("/{doc_id}/chunks", response_model=DocumentChunksOut)
async def get_document_chunks_by_id(
    doc_id: str,
    user: UserContext = Depends(get_current_user),
):
    doc = await get_document(doc_id, user.user_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document not found: {doc_id}")
    chunks = get_document_chunks(doc_id, user.user_id)
    return DocumentChunksOut(document_id=doc_id, chunks=chunks, total=len(chunks))


@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_document_by_id(doc_id: str, user: UserContext = Depends(get_current_user)):
    doc = await get_document(doc_id, user.user_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document not found: {doc_id}")
    storage_path = await get_document_storage_path(doc_id, user.user_id)
    deleted = delete_document_chunks(doc_id, user.user_id)
    await delete_document(doc_id, user.user_id)
    if storage_path and os.path.exists(storage_path):
        os.remove(storage_path)
    return DeleteResponse(
        success=True,
        message=f"Document '{doc.filename}' and its {deleted} chunks have been deleted.",
    )


@router.post("/bulk-delete", response_model=DeleteResponse)
async def bulk_delete_documents(
    request: BulkDeleteRequest,
    user: UserContext = Depends(get_current_user),
):
    deleted_docs = 0
    deleted_chunks = 0
    for doc_id in request.document_ids:
        doc = await get_document(doc_id, user.user_id)
        if not doc:
            continue
        storage_path = await get_document_storage_path(doc_id, user.user_id)
        deleted_chunks += delete_document_chunks(doc_id, user.user_id)
        if await delete_document(doc_id, user.user_id):
            deleted_docs += 1
        if storage_path and os.path.exists(storage_path):
            os.remove(storage_path)

    return DeleteResponse(
        success=True,
        message=f"Deleted {deleted_docs} documents and {deleted_chunks} chunks.",
    )
