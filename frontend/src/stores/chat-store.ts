import { create } from "zustand";
import type { Message, Source } from "@/lib/types";

interface ChatState {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  activeConversationId: string | null;
  sources: Source[];
  error: string | null;

  // Actions
  setActiveConversation: (id: string | null) => void;
  addUserMessage: (content: string) => void;
  startStreaming: () => void;
  appendStreamChunk: (content: string) => void;
  setStreamSources: (sources: Source[]) => void;
  finishStreaming: (conversationId: string) => void;
  stopStreaming: () => void;
  setError: (error: string | null) => void;
  loadMessages: (messages: Message[]) => void;
  clearChat: () => void;
}

let messageIdCounter = 0;
function genId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streamingContent: "",
  isStreaming: false,
  activeConversationId: null,
  sources: [],
  error: null,

  setActiveConversation: (id) =>
    set({ activeConversationId: id, messages: [], streamingContent: "", sources: [], error: null }),

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: genId(), role: "user", content, timestamp: new Date().toISOString() },
      ],
      error: null,
    })),

  startStreaming: () =>
    set({ isStreaming: true, streamingContent: "", sources: [], error: null }),

  appendStreamChunk: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),

  setStreamSources: (sources) => set({ sources }),

  finishStreaming: (conversationId) =>
    set((state) => {
      const finalContent = state.streamingContent;
      if (!finalContent.trim()) return { isStreaming: false };

      return {
        messages: [
          ...state.messages,
          {
            id: genId(),
            role: "assistant",
            content: finalContent,
            sources: state.sources,
            timestamp: new Date().toISOString(),
          },
        ],
        streamingContent: "",
        isStreaming: false,
        activeConversationId: conversationId || state.activeConversationId,
      };
    }),

  stopStreaming: () =>
    set((state) => {
      const partial = state.streamingContent;
      if (partial.trim()) {
        return {
          messages: [
            ...state.messages,
            {
              id: genId(),
              role: "assistant",
              content: partial + "\n\n*[Generation stopped]*",
              sources: state.sources,
              timestamp: new Date().toISOString(),
            },
          ],
          streamingContent: "",
          isStreaming: false,
        };
      }
      return { isStreaming: false, streamingContent: "" };
    }),

  setError: (error) => set({ error, isStreaming: false }),

  loadMessages: (messages) => set({ messages, streamingContent: "", sources: [] }),

  clearChat: () =>
    set({
      messages: [],
      streamingContent: "",
      isStreaming: false,
      activeConversationId: null,
      sources: [],
      error: null,
    }),
}));
