from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import chat
from app.core.retriever import ChunkWithScore


def make_client(monkeypatch):
    app = FastAPI()
    app.include_router(chat.router)

    async def fake_create_conversation(conv_id: str, created_at: str, owner_id: str = "public"):
        return {"conversation_id": conv_id, "title": None, "created_at": created_at}

    async def fake_get_conversation(conv_id: str, owner_id: str = "public"):
        return None

    async def fake_add_message(*args, **kwargs):
        return None

    async def fake_retrieve_candidates(*args, **kwargs):
        return [
            ChunkWithScore(
                chunk_id="doc1_0",
                document_id="doc1",
                document_name="handbook.txt",
                text="Internship applications should include project demos.",
                chunk_index=0,
                page_number=1,
                similarity_score=0.9,
            )
        ]

    async def fake_rerank_with_llm(query, candidates, top_k=4):
        return candidates[:top_k]

    async def fake_generate_answer(query, chunks, history):
        return "Include a deployed demo in your internship application [1]."

    monkeypatch.setattr(chat.settings, "deepseek_api_key", "sk-test")
    monkeypatch.setattr(chat, "create_conversation", fake_create_conversation)
    monkeypatch.setattr(chat, "get_conversation", fake_get_conversation)
    monkeypatch.setattr(chat, "add_message", fake_add_message)
    monkeypatch.setattr(chat, "retrieve_candidates", fake_retrieve_candidates)
    monkeypatch.setattr(chat, "rerank_with_llm", fake_rerank_with_llm)
    monkeypatch.setattr(chat, "generate_answer", fake_generate_answer)

    return TestClient(app)


def test_chat_send_non_streaming_returns_citations(monkeypatch):
    client = make_client(monkeypatch)

    response = client.post(
        "/api/v1/chat/send",
        json={"query": "How should I use this for internships?", "stream": False},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["answer"].endswith("[1].")
    assert body["sources"][0]["document_name"] == "handbook.txt"
    assert body["conversation_id"]


def test_chat_rejects_empty_query(monkeypatch):
    client = make_client(monkeypatch)

    response = client.post("/api/v1/chat/send", json={"query": "   ", "stream": False})

    assert response.status_code == 400
    assert response.json()["detail"] == "Query cannot be empty."
