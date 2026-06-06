"""Chat endpoint with streaming SSE and non-streaming JSON responses."""

import uuid
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.auth import UserContext, get_current_user
from app.models.chat import (
    ChatRequest,
    ChatResponse,
)
from app.core.retriever import retrieve_candidates, rerank_with_llm
from app.core.generator import generate_answer, generate_stream
from app.core.citation import extract_sources
from app.db.metadata_store import (
    get_conversation,
    create_conversation,
    add_message,
)
from config import settings

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

MAX_QUERY_LENGTH = 4000


@router.post("/send")
async def send_message(
    request: ChatRequest,
    user: UserContext = Depends(get_current_user),
):
    """Send a query and get an AI response with citations."""
    # Validate
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if len(request.query) > MAX_QUERY_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Query too long ({len(request.query)} chars). Max: {MAX_QUERY_LENGTH}.",
        )
    if not settings.deepseek_api_key and not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="No LLM API key configured.")

    # Get or create conversation
    conv_id = request.conversation_id or str(uuid.uuid4())
    if not request.conversation_id:
        now = datetime.now(timezone.utc).isoformat()
        await create_conversation(conv_id, now, user.user_id)

    # Load conversation history
    conversation = await get_conversation(conv_id, user.user_id)
    if request.conversation_id and not conversation:
        raise HTTPException(status_code=404, detail=f"Conversation not found: {conv_id}")
    history = conversation.messages if conversation else []

    # Save user message
    now = datetime.now(timezone.utc).isoformat()
    user_msg_id = str(uuid.uuid4())
    await add_message(user_msg_id, conv_id, "user", request.query.strip(), created_at=now)

    document_ids = request.document_ids or None

    # Retrieve relevant chunks for the query.
    candidates = await retrieve_candidates(
        request.query.strip(),
        document_ids=document_ids,
        owner_id=user.user_id,
        top_k=settings.retrieval_top_k,
    )

    # Rerank
    top_chunks = await rerank_with_llm(
        request.query.strip(),
        candidates,
        top_k=settings.rerank_top_k,
    )

    if request.stream:
        return await _stream_response(request.query.strip(), top_chunks, conv_id, history)
    else:
        return await _json_response(request.query.strip(), top_chunks, conv_id, history)


async def _json_response(
    query: str,
    chunks: list,
    conv_id: str,
    history: list,
) -> ChatResponse:
    """Non-streaming JSON response."""
    try:
        answer = await generate_answer(query, chunks, history)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM service unavailable: {str(e)[:200]}")

    sources = extract_sources(answer, chunks)

    # Save assistant message
    now = datetime.now(timezone.utc).isoformat()
    await add_message(str(uuid.uuid4()), conv_id, "assistant", answer, sources, now)

    return ChatResponse(answer=answer, sources=sources, conversation_id=conv_id)


async def _stream_response(
    query: str,
    chunks: list,
    conv_id: str,
    history: list,
):
    """Streaming SSE response."""
    async def event_generator():
        full_text = ""
        try:
            async for sse_event in generate_stream(query, chunks, history):
                event = None
                if sse_event.startswith("data: "):
                    try:
                        event = json.loads(sse_event[6:].strip())
                    except json.JSONDecodeError:
                        event = None

                if event and event.get("type") == "chunk":
                    full_text += event.get("content", "")
                    yield sse_event
                elif event and event.get("type") == "error":
                    yield sse_event
                    return
                elif event and event.get("type") == "done":
                    continue
                else:
                    yield sse_event

            # After streaming complete, extract sources and send them
            if full_text:
                sources = extract_sources(full_text, chunks)
                sources_json = json.dumps({
                    "type": "sources",
                    "sources": [s.model_dump() for s in sources],
                })
                yield f"data: {sources_json}\n\n"

                # Save assistant message
                now = datetime.now(timezone.utc).isoformat()
                await add_message(
                    str(uuid.uuid4()), conv_id, "assistant", full_text, sources, now
                )

            # Send final event with conversation_id
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)[:300]})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
