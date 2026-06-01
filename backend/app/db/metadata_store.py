"""SQLite metadata store for documents, conversations, and messages."""

import os
import json
import aiosqlite
from typing import Optional, List
from config import settings
from app.models.document import DocumentOut
from app.models.chat import MessageOut, ConversationOut, ConversationListItem, Source

# Module-level singleton connection — created once, reused for all operations
_db: Optional[aiosqlite.Connection] = None


async def _get_db() -> aiosqlite.Connection:
    """Get the shared SQLite connection (created on first call)."""
    global _db
    if _db is None:
        os.makedirs(os.path.dirname(settings.metadata_db_path) or ".", exist_ok=True)
        _db = await aiosqlite.connect(settings.metadata_db_path, timeout=10)
        _db.row_factory = aiosqlite.Row
        # Enable WAL mode for better concurrent read/write performance
        await _db.execute("PRAGMA journal_mode=WAL")
        await _db.execute("PRAGMA busy_timeout=5000")
    return _db


async def init_db():
    """Create tables if they don't exist."""
    db = await _get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                chunk_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'processing',
                created_at TEXT NOT NULL,
                error_message TEXT
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sources_json TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_messages_conv
                ON messages(conversation_id, created_at);
        """)
        await db.commit()


# --- Document operations ---

async def insert_document(doc: DocumentOut) -> DocumentOut:
    db = await _get_db()
    try:
        await db.execute(
            """INSERT INTO documents (id, filename, file_type, file_size_bytes,
               chunk_count, status, created_at, error_message)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (doc.id, doc.filename, doc.file_type, doc.file_size_bytes,
             doc.chunk_count, doc.status, doc.created_at, doc.error_message),
        )
        await db.commit()
    return doc


async def get_document(doc_id: str) -> Optional[DocumentOut]:
    db = await _get_db()
    try:
        async with db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return DocumentOut(**dict(row))
    return None


async def list_documents() -> List[DocumentOut]:
    db = await _get_db()
    try:
        async with db.execute(
            "SELECT * FROM documents ORDER BY created_at DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [DocumentOut(**dict(r)) for r in rows]


async def update_document_status(doc_id: str, status: str, error_message: Optional[str] = None):
    db = await _get_db()
    try:
        await db.execute(
            "UPDATE documents SET status = ?, error_message = ? WHERE id = ?",
            (status, error_message, doc_id),
        )
        await db.commit()


async def update_document_chunk_count(doc_id: str, chunk_count: int):
    db = await _get_db()
    try:
        await db.execute(
            "UPDATE documents SET chunk_count = ? WHERE id = ?",
            (chunk_count, doc_id),
        )
        await db.commit()


async def delete_document(doc_id: str) -> bool:
    db = await _get_db()
    try:
        cursor = await db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        await db.commit()
        return cursor.rowcount > 0


# --- Conversation operations ---

async def create_conversation(conv_id: str, created_at: str) -> dict:
    db = await _get_db()
    try:
        await db.execute(
            "INSERT INTO conversations (id, title, created_at) VALUES (?, NULL, ?)",
            (conv_id, created_at),
        )
        await db.commit()
    return {"conversation_id": conv_id, "title": None, "created_at": created_at}


async def list_conversations() -> List[ConversationListItem]:
    db = await _get_db()
    try:
        async with db.execute("""
            SELECT c.id, c.title, c.created_at, COUNT(m.id) as message_count
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        """) as cursor:
            rows = await cursor.fetchall()
            return [
                ConversationListItem(
                    conversation_id=r["id"],
                    title=r["title"],
                    created_at=r["created_at"],
                    message_count=r["message_count"],
                )
                for r in rows
            ]


async def get_conversation(conv_id: str) -> Optional[ConversationOut]:
    db = await _get_db()
    try:
        async with db.execute(
            "SELECT * FROM conversations WHERE id = ?", (conv_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None

        async with db.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conv_id,),
        ) as cursor:
            msg_rows = await cursor.fetchall()
            messages = []
            for mr in msg_rows:
                mr_dict = dict(mr)
                sources = None
                if mr_dict.get("sources_json"):
                    try:
                        sources_data = json.loads(mr_dict["sources_json"])
                        sources = [Source(**s) for s in sources_data]
                    except (json.JSONDecodeError, TypeError):
                        pass
                messages.append(
                    MessageOut(
                        role=mr_dict["role"],
                        content=mr_dict["content"],
                        sources=sources,
                        timestamp=mr_dict["created_at"],
                    )
                )

        return ConversationOut(
            conversation_id=row["id"],
            title=row["title"],
            created_at=row["created_at"],
            messages=messages,
        )


async def add_message(
    msg_id: str,
    conv_id: str,
    role: str,
    content: str,
    sources: Optional[List[Source]] = None,
    created_at: str = "",
) -> None:
    db = await _get_db()
    try:
        sources_json = None
        if sources:
            sources_json = json.dumps([s.model_dump() for s in sources], ensure_ascii=False)

        await db.execute(
            """INSERT INTO messages (id, conversation_id, role, content, sources_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (msg_id, conv_id, role, content, sources_json, created_at),
        )

        # Auto-generate conversation title from first user message
        if role == "user":
            async with db.execute(
                "SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?",
                (conv_id,),
            ) as cursor:
                row = await cursor.fetchone()
                if row and row["cnt"] == 1:
                    title = content[:80] + ("..." if len(content) > 80 else "")
                    await db.execute(
                        "UPDATE conversations SET title = ? WHERE id = ?",
                        (title, conv_id),
                    )

        await db.commit()


async def delete_conversation(conv_id: str) -> bool:
    db = await _get_db()
    try:
        await db.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        cursor = await db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        await db.commit()
        return cursor.rowcount > 0
