"""Two-stage retrieval: ChromaDB similarity + LLM reranking."""

from dataclasses import dataclass
from typing import List, Optional
import json
import httpx
from config import settings
from app.core.embedder import embed_query
from app.db.vector_store import query_by_embedding


@dataclass
class ChunkWithScore:
    chunk_id: str
    document_id: str
    document_name: str
    text: str
    chunk_index: int
    page_number: Optional[int] = None
    similarity_score: float = 0.0
    relevance_score: float = 0.0


async def retrieve_candidates(
    query_text: str,
    document_ids: Optional[List[str]] = None,
    owner_id: str = "public",
    top_k: int = 10,
) -> List[ChunkWithScore]:
    """Stage 1: Embed query, then ChromaDB similarity search."""
    q_embedding = await embed_query(query_text)
    results = query_by_embedding(
        q_embedding,
        document_ids=document_ids,
        owner_id=owner_id,
        n_results=top_k,
    )

    chunks = []
    if results["ids"] and results["ids"][0]:
        for i, chunk_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i] if results.get("distances") else 1.0
            similarity = 1.0 / (1.0 + distance)
            metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
            text = results["documents"][0][i] if results.get("documents") else ""

            if similarity < 0.5:
                continue

            chunks.append(ChunkWithScore(
                chunk_id=chunk_id,
                document_id=metadata.get("document_id", ""),
                document_name=metadata.get("document_name", ""),
                text=text,
                chunk_index=metadata.get("chunk_index", 0),
                page_number=metadata.get("page_number"),
                similarity_score=round(similarity, 4),
            ))

    return chunks


async def rerank_with_llm(
    query: str, candidates: List[ChunkWithScore], top_k: int = 4
) -> List[ChunkWithScore]:
    """Stage 2: LLM batch reranking."""
    if not candidates:
        return []
    if len(candidates) <= top_k:
        return candidates

    passages = "\n\n".join(f"[{i}] {c.text[:300]}..." for i, c in enumerate(candidates))
    prompt = f"""Rate how relevant each passage is to answering the query on a scale of 1-10.
Query: {query}

Passages:
{passages}

Output strictly as JSON array: [{{"id": 0, "score": 8}}, ...]
Only output the JSON."""

    try:
        api_key = settings.deepseek_api_key or settings.openai_api_key
        if not api_key:
            return candidates[:top_k]

        base_url = settings.deepseek_base_url if settings.deepseek_api_key else "https://api.openai.com/v1"
        model = settings.llm_model if settings.deepseek_api_key else settings.llm_fallback_model

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{base_url}/chat/completions",
                json={"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0, "max_tokens": 500},
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                timeout=15.0,
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                scores = _parse_json(content)
                if scores:
                    for item in scores:
                        idx, score = item.get("id", -1), item.get("score", 5)
                        if 0 <= idx < len(candidates):
                            candidates[idx].relevance_score = float(score)
    except Exception:
        pass

    candidates.sort(key=lambda c: c.relevance_score or c.similarity_score, reverse=True)
    result = [c for c in candidates[:top_k] if c.relevance_score < 1 or c.relevance_score >= 3]
    return result or candidates[:top_k]


def _parse_json(content: str) -> Optional[List[dict]]:
    """Parse JSON array from LLM output, handling various formats including code blocks."""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    import re

    # Try fenced code block first
    m = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", content, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    # Find the LAST JSON array (avoid greedy match that captures citation [N] markers)
    # Strategy: find last '[' and matching ']', extract, try to parse
    last_open = content.rfind("[{")
    last_close = content.rfind("}]")
    if last_open >= 0 and last_close > last_open:
        try:
            return json.loads(content[last_open:last_close + 2])
        except json.JSONDecodeError:
            pass

    # Fallback: find any [{ ... }] pattern
    m = re.search(r"\[\s*\{.*?\}\s*\]", content, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    return None
