"""AI Document Assistant — FastAPI Application Entry Point."""

import os
from contextlib import asynccontextmanager

# Set HuggingFace mirror BEFORE any ChromaDB imports (for users in China)
if os.environ.get("HF_ENDPOINT"):
    pass  # Already set by user
elif os.path.exists(".env"):
    # Read HF_ENDPOINT from .env early, before ChromaDB initializes
    try:
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("HF_ENDPOINT="):
                    val = line.split("=", 1)[1].strip()
                    os.environ["HF_ENDPOINT"] = val
                    break
    except Exception:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from app.api.router import api_router
from app.db.metadata_store import init_db
from app.utils.exception_handlers import value_error_handler, generic_exception_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await init_db()
    yield


app = FastAPI(
    title="AI Document Assistant",
    description="RAG-powered document Q&A system. Upload PDF/DOCX/TXT and ask questions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(ValueError, value_error_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Mount all API routes
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
