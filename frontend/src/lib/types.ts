/* TypeScript types matching backend Pydantic schemas */

export interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  status: "processing" | "ready" | "error";
  created_at: string;
  error_message: string | null;
}

export interface DocumentList {
  documents: Document[];
  total: number;
}

export interface DocumentChunk {
  id: string;
  text: string;
  chunk_index: number;
  page_number: number | null;
}

export interface DocumentChunks {
  document_id: string;
  chunks: DocumentChunk[];
  total: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface Source {
  document_id: string;
  document_name: string;
  chunk_index: number;
  text: string;
  relevance_score: number;
  page_number: number | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: string;
}

export interface Conversation {
  conversation_id: string;
  title: string | null;
  created_at: string;
  messages: Message[];
}

export interface ConversationListItem {
  conversation_id: string;
  title: string | null;
  created_at: string;
  message_count: number;
}

export interface ConversationList {
  conversations: ConversationListItem[];
  total: number;
}

export interface ChatRequest {
  query: string;
  document_ids?: string[] | null;
  conversation_id?: string | null;
  stream?: boolean;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  conversation_id: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  llm_configured: boolean;
  model: string;
  auth_enabled: boolean;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export type SSEEvent =
  | { type: "chunk"; content: string }
  | { type: "sources"; sources: Source[] }
  | { type: "done"; conversation_id: string }
  | { type: "error"; message: string };
