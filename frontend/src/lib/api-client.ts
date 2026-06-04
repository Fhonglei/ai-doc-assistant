/* Typed fetch wrappers for all backend API endpoints */

import { API_BASE_URL } from "./constants";
import type {
  Document,
  DocumentList,
  DeleteResponse,
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationList,
} from "./types";
import type { SSEEvent } from "./types";

// --- Health ---

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Backend unavailable");
  return res.json();
}

// --- Documents ---

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Upload failed (${res.status})`);
  }

  return res.json();
}

export async function listDocuments(): Promise<DocumentList> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function getDocument(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`);
  if (!res.ok) throw new Error("Document not found");
  return res.json();
}

export async function deleteDocument(id: string): Promise<DeleteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
  return res.json();
}

// --- Chat (streaming) ---

export async function sendChatMessage(
  request: ChatRequest,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Chat request failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const event: SSEEvent = JSON.parse(dataStr);
            onEvent(event);
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function sendChatMessageNonStreaming(
  request: ChatRequest
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: false }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Chat request failed (${res.status})`);
  }

  return res.json();
}

// --- Conversations ---

export async function createConversation(): Promise<{ conversation_id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function listConversations(): Promise<ConversationList> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations/${id}`);
  if (!res.ok) throw new Error("Conversation not found");
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
}
