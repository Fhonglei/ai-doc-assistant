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

type ApiErrorBody = {
  detail?: string | { message?: string };
  error?: { message?: string; code?: string };
  message?: string;
};

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return `${fallback} (${res.status})`;

  try {
    const body = JSON.parse(text) as ApiErrorBody;
    if (typeof body.detail === "string") return body.detail;
    if (body.detail?.message) return body.detail.message;
    if (body.error?.message) return body.error.message;
    if (body.message) return body.message;
  } catch {
    // Plain text response body; fall through below.
  }

  return text || `${fallback} (${res.status})`;
}

async function ensureOk(res: Response, fallback: string): Promise<void> {
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, fallback));
  }
}

function consumeSSEFrames(
  buffer: string,
  onEvent: (event: SSEEvent) => void
): string {
  const frames = buffer.split(/\r?\n\r?\n/);
  const remainder = frames.pop() || "";

  for (const frame of frames) {
    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();

    if (!data || data === "[DONE]") continue;

    try {
      onEvent(JSON.parse(data) as SSEEvent);
    } catch {
      // Ignore malformed SSE payloads while keeping the stream alive.
    }
  }

  return remainder;
}

// --- Health ---

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    method: "GET",
    cache: "no-store",
  });
  await ensureOk(res, "Backend unavailable");
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

  await ensureOk(res, "Upload failed");

  return res.json();
}

export async function listDocuments(): Promise<DocumentList> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents`);
  await ensureOk(res, "Failed to fetch documents");
  return res.json();
}

export async function getDocument(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`);
  await ensureOk(res, "Document not found");
  return res.json();
}

export async function deleteDocument(id: string): Promise<DeleteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
    method: "DELETE",
  });
  await ensureOk(res, "Failed to delete document");
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

  await ensureOk(res, "Chat request failed");

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = consumeSSEFrames(buffer, onEvent);
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      consumeSSEFrames(`${buffer}\n\n`, onEvent);
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

  await ensureOk(res, "Chat request failed");

  return res.json();
}

// --- Conversations ---

export async function createConversation(): Promise<{ conversation_id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations`, {
    method: "POST",
  });
  await ensureOk(res, "Failed to create conversation");
  return res.json();
}

export async function listConversations(): Promise<ConversationList> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations`);
  await ensureOk(res, "Failed to fetch conversations");
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations/${id}`);
  await ensureOk(res, "Conversation not found");
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/conversations/${id}`, {
    method: "DELETE",
  });
  await ensureOk(res, "Failed to delete conversation");
}
