"""AI Document Assistant — FastAPI Application Entry Point."""

import os
import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set HuggingFace mirror BEFORE any HuggingFace imports (for users in China)
if os.environ.get("HF_ENDPOINT"):
    pass
elif os.path.exists(".env"):
    try:
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("HF_ENDPOINT="):
                    os.environ["HF_ENDPOINT"] = line.split("=", 1)[1].strip()
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
    """Startup: init DB and preload embedding model."""
    if settings.auth_enabled and settings.auth_secret_key == "change-me-before-deploying":
        logger.warning("AUTH_ENABLED is true but AUTH_SECRET_KEY is still the default value.")

    logger.info("Initializing database...")
    await init_db()

    logger.info("Loading embedding model (first request will be instant)...")
    try:
        import asyncio
        from app.core.embedder import embed_query
        await embed_query("warmup")  # Eager-load the model
        logger.info("Embedding model ready.")
    except Exception as e:
        logger.warning(f"Embedding model not preloaded (will load on first request): {e}")

    yield
    logger.info("Shutting down...")


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


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
