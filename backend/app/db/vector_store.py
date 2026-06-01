"""ChromaDB vector store — stores pre-computed embeddings (no auto-embed)."""

import os
import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from config import settings

logger = logging.getLogger(__name__)

_collection = None
_client = None


def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_collection() -> chromadb.Collection:
    """Get or create collection. NO auto-embedding — we pass embeddings manually."""
    global _collection
    if _collection is None:
        client = get_client()
        _collection = client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(
    document_id: str,
    texts: list[str],
    metadatas: list[dict],
    embeddings: list[list[float]],
    document_name: str,
) -> int:
    """Add chunks with pre-computed embeddings to ChromaDB."""
    collection = get_collection()

    ids = [f"{document_id}_{i}" for i in range(len(texts))]
    for meta in metadatas:
        meta["document_name"] = document_name
        meta["document_id"] = document_id

    if ids:
        collection.add(ids=ids, documents=texts, metadatas=metadatas, embeddings=embeddings)

    return len(ids)


def query_by_embedding(
    query_embedding: list[float],
    document_ids: list[str] | None = None,
    n_results: int = 10,
) -> dict:
    """Query by pre-computed embedding vector. Returns empty result if collection is empty."""
    collection = get_collection()
    count = collection.count()

    # Guard: ChromaDB rejects n_results=0 with TypeError
    if count == 0:
        return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

    where_filter = {"document_id": {"$in": document_ids}} if document_ids else None
    actual_n = max(1, min(n_results, count))

    return collection.query(
        query_embeddings=[query_embedding],
        n_results=actual_n,
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )


def delete_document_chunks(document_id: str) -> int:
    """Delete all chunks for a document. Returns count deleted, or raises on storage error."""
    collection = get_collection()
    try:
        results = collection.get(where={"document_id": document_id})
        if results["ids"]:
            collection.delete(ids=results["ids"])
            return len(results["ids"])
        return 0
    except Exception as e:
        logger.error(f"Failed to delete chunks for document {document_id}: {e}")
        raise  # Don't swallow storage errors — let the caller decide
