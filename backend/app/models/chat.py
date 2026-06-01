"""Chat-related Pydantic schemas."""

from typing import Optional, List
from pydantic import BaseModel, Field


class Source(BaseModel):
    document_id: str
    document_name: str
    chunk_index: int
    text: str
    relevance_score: float
    page_number: Optional[int] = None


class ChatRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None
    conversation_id: Optional[str] = None
    stream: bool = True


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    conversation_id: str


class MessageOut(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    sources: Optional[List[Source]] = None
    timestamp: str


class ConversationOut(BaseModel):
    conversation_id: str
    title: Optional[str] = None
    created_at: str
    messages: List[MessageOut] = []


class ConversationListItem(BaseModel):
    conversation_id: str
    title: Optional[str] = None
    created_at: str
    message_count: int = 0


class ConversationListOut(BaseModel):
    conversations: List[ConversationListItem]
    total: int


class ConversationCreateOut(BaseModel):
    conversation_id: str
    title: Optional[str] = None
    created_at: str
