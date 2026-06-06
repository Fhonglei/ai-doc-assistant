"""Document-related Pydantic schemas."""

from typing import Optional, List
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    status: str  # "processing" | "ready" | "error"
    created_at: str
    error_message: Optional[str] = None


class DocumentListOut(BaseModel):
    documents: List[DocumentOut]
    total: int


class DeleteResponse(BaseModel):
    success: bool
    message: str


class DocumentRenameRequest(BaseModel):
    filename: str


class BulkDeleteRequest(BaseModel):
    document_ids: List[str]


class ChunkOut(BaseModel):
    id: str
    text: str
    chunk_index: int
    page_number: Optional[int] = None


class DocumentChunksOut(BaseModel):
    document_id: str
    chunks: List[ChunkOut]
    total: int


class ChunkMetadata(BaseModel):
    chunk_index: int
    page_number: Optional[int] = None
    text: str
    document_id: str
    document_name: str
