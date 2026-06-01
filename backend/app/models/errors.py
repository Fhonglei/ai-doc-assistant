"""Unified error response models."""

from typing import Any, Optional
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    detail: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


# Pre-defined error codes
class ErrorCode:
    UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND"
    EMPTY_QUERY = "EMPTY_QUERY"
    EMPTY_DOCUMENT = "EMPTY_DOCUMENT"
    CORRUPTED_FILE = "CORRUPTED_FILE"
    SCANNED_PDF = "SCANNED_PDF"
    EMBEDDING_FAILED = "EMBEDDING_FAILED"
    LLM_FAILED = "LLM_FAILED"
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"
