"""LLM generation with citation-aware prompting and SSE streaming."""

from typing import List, AsyncIterator, Optional
import json
import httpx
from config import settings
from app.core.retriever import ChunkWithScore
from app.models.chat import MessageOut


SYSTEM_PROMPT = """You are an AI document assistant. Answer the user's question based ONLY on the provided document excerpts. Follow these rules strictly:

1. Base your answer on the excerpts below. If the excerpts do not contain enough information, say: "I couldn't find relevant information about that in the uploaded documents."
2. When you use information from an excerpt, cite it inline using [N] immediately after the relevant statement. Example: "Revenue grew by 20% [1]."
3. You may combine information from multiple excerpts: [1][3].
4. Do not cite sources you are not directly using.
5. Format your answer in clear markdown with headings, bullet points, and paragraphs as appropriate.
6. Keep answers concise but thorough. Prefer specific data points and direct quotes over vague summaries."""


def build_prompt(
    query: str,
    chunks: List[ChunkWithScore],
    conversation_history: Optional[List[MessageOut]] = None,
) -> tuple[str, str]:
    """Build system and user messages for the LLM."""
    # Build source excerpts section
    excerpts_parts = []
    for i, chunk in enumerate(chunks):
        marker = i + 1  # 1-based for the LLM
        source_info = f"(from {chunk.document_name}"
        if chunk.page_number:
            source_info += f", page {chunk.page_number}"
        source_info += ")"
        excerpts_parts.append(f"[{marker}] {source_info}:\n{chunk.text}")

    excerpts_text = "\n\n".join(excerpts_parts) if excerpts_parts else "(No relevant document excerpts found.)"

    # Build conversation history section
    history_text = ""
    if conversation_history:
        history_parts = []
        for msg in conversation_history[-6:]:  # Last 6 messages for context
            role = "User" if msg.role == "user" else "Assistant"
            history_parts.append(f"{role}: {msg.content}")
        history_text = "\n".join(history_parts)

    user_message = f"""Document excerpts:

{excerpts_text}

---

Conversation history:
{history_text if history_text else "(This is the first message in this conversation)"}

---

User question: {query}"""

    return SYSTEM_PROMPT, user_message


async def generate_answer(
    query: str,
    chunks: List[ChunkWithScore],
    conversation_history: Optional[List[MessageOut]] = None,
) -> str:
    """Non-streaming generation. Returns the full answer."""
    system_msg, user_msg = build_prompt(query, chunks, conversation_history)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            _get_chat_url(),
            json={
                "model": _get_model(),
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                "temperature": 0.3,
                "max_tokens": 2048,
            },
            headers=_get_headers(),
            timeout=60.0,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"LLM API returned {response.status_code}: {response.text[:300]}"
            )

        data = response.json()
        return data["choices"][0]["message"]["content"]


async def generate_stream(
    query: str,
    chunks: List[ChunkWithScore],
    conversation_history: Optional[List[MessageOut]] = None,
) -> AsyncIterator[str]:
    """Streaming generation. Yields SSE event strings."""
    system_msg, user_msg = build_prompt(query, chunks, conversation_history)

    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            _get_chat_url(),
            json={
                "model": _get_model(),
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                "temperature": 0.3,
                "max_tokens": 2048,
                "stream": True,
            },
            headers=_get_headers(),
            timeout=120.0,
        ) as response:
            if response.status_code != 200:
                body = await response.aread()
                yield f'data: {{"type":"error","message":"LLM API error: {response.status_code}"}}\n\n'
                return

            full_text = ""
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            full_text += content
                            event = json.dumps({"type": "chunk", "content": content})
                            yield f"data: {event}\n\n"
                    except json.JSONDecodeError:
                        continue

            # Signal completion
            yield f"data: {json.dumps({'type': 'done', 'full_text': full_text})}\n\n"


def _get_chat_url() -> str:
    base = settings.deepseek_base_url if settings.deepseek_api_key else "https://api.openai.com/v1"
    return f"{base}/chat/completions"


def _get_model() -> str:
    return settings.llm_model if settings.deepseek_api_key else settings.llm_fallback_model


def _get_headers() -> dict:
    api_key = settings.deepseek_api_key or settings.openai_api_key
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
