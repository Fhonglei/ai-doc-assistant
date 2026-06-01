"""Embedding generation using local sentence-transformers (already cached via HF mirror)."""

import asyncio
import os
from typing import List
from functools import lru_cache
import numpy as np


class EmbeddingError(Exception):
    """Raised when embedding generation fails."""


# Ensure HF mirror is set for sentence-transformers (it's already cached)
if os.environ.get("HF_ENDPOINT") is None and os.path.exists(".env"):
    try:
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("HF_ENDPOINT="):
                    os.environ["HF_ENDPOINT"] = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass

_model = None


def _get_model():
    """Lazy-load sentence-transformers (uses already-cached model from HF mirror)."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _embed_sync(texts: List[str]) -> List[List[float]]:
    """Synchronous embedding — runs in thread pool."""
    model = _get_model()
    embeddings = model.encode(texts, normalize_embeddings=True)
    if isinstance(embeddings, np.ndarray):
        return embeddings.tolist()
    return [list(e) for e in embeddings]


async def embed_chunks(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of text chunks (CPU-bound, runs in thread pool)."""
    try:
        return await asyncio.to_thread(_embed_sync, texts)
    except Exception as e:
        raise EmbeddingError(f"Embedding failed: {str(e)[:300]}")


async def embed_query(text: str) -> List[float]:
    """Generate embedding for a single query string."""
    embeddings = await embed_chunks([text])
    return embeddings[0]
