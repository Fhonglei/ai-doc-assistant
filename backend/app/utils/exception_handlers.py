"""Global FastAPI exception handlers that return structured JSON errors."""

from fastapi import Request
from fastapi.responses import JSONResponse
from app.models.errors import ErrorResponse, ErrorDetail, ErrorCode


async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Parse ValueError messages with CODE: prefix into structured errors."""
    msg = str(exc)
    if msg.startswith("FILE_TOO_LARGE:"):
        code = ErrorCode.FILE_TOO_LARGE
        message = msg[len("FILE_TOO_LARGE:"):].strip()
    elif msg.startswith("UNSUPPORTED_FILE_TYPE:"):
        code = ErrorCode.UNSUPPORTED_FILE_TYPE
        message = msg[len("UNSUPPORTED_FILE_TYPE:"):].strip()
    elif msg.startswith("EMPTY_DOCUMENT:"):
        code = ErrorCode.EMPTY_DOCUMENT
        message = msg[len("EMPTY_DOCUMENT:"):].strip()
    elif msg.startswith("CORRUPTED_FILE:"):
        code = ErrorCode.CORRUPTED_FILE
        message = msg[len("CORRUPTED_FILE:"):].strip()
    elif msg.startswith("SCANNED_PDF:"):
        code = ErrorCode.SCANNED_PDF
        message = msg[len("SCANNED_PDF:"):].strip()
    else:
        code = ErrorCode.INTERNAL_ERROR
        message = msg

    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            error=ErrorDetail(code=code, message=message)
        ).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unexpected errors."""
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error=ErrorDetail(
                code=ErrorCode.INTERNAL_ERROR,
                message="An unexpected error occurred. Please try again.",
            )
        ).model_dump(),
    )
