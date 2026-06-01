"""Conversation CRUD endpoints."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.models.chat import (
    ConversationOut,
    ConversationListOut,
    ConversationCreateOut,
)
from app.models.document import DeleteResponse
from app.db.metadata_store import (
    create_conversation,
    list_conversations,
    get_conversation,
    delete_conversation,
)

router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])


@router.post("", response_model=ConversationCreateOut, status_code=201)
async def create_new_conversation():
    """Create a new empty conversation."""
    conv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    result = await create_conversation(conv_id, now)
    return ConversationCreateOut(**result)


@router.get("", response_model=ConversationListOut)
async def list_all_conversations():
    """List all conversations."""
    convs = await list_conversations()
    return ConversationListOut(conversations=convs, total=len(convs))


@router.get("/{conv_id}", response_model=ConversationOut)
async def get_conversation_by_id(conv_id: str):
    """Get a conversation with all its messages."""
    conv = await get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail=f"Conversation not found: {conv_id}")
    return conv


@router.delete("/{conv_id}")
async def delete_conversation_by_id(conv_id: str):
    """Delete a conversation and its messages."""
    deleted = await delete_conversation(conv_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Conversation not found: {conv_id}")
    return {"success": True, "message": f"Conversation deleted."}
