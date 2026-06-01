import { useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { sendChatMessage } from "@/lib/api-client";
import type { SSEEvent } from "@/lib/types";

export function useChat() {
  // Destructure individual selectors (Zustand actions are stable refs)
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const sources = useChatStore((s) => s.sources);
  const error = useChatStore((s) => s.error);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const startStreaming = useChatStore((s) => s.startStreaming);
  const appendStreamChunk = useChatStore((s) => s.appendStreamChunk);
  const setStreamSources = useChatStore((s) => s.setStreamSources);
  const finishStreaming = useChatStore((s) => s.finishStreaming);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const setError = useChatStore((s) => s.setError);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const clearChat = useChatStore((s) => s.clearChat);

  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (query: string, documentIds?: string[] | null) => {
      if (!query.trim() || isStreaming) return;

      addUserMessage(query);
      startStreaming();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await sendChatMessage(
          { query: query.trim(), document_ids: documentIds, conversation_id: activeConversationId, stream: true },
          (event: SSEEvent) => {
            switch (event.type) {
              case "chunk": appendStreamChunk(event.content); break;
              case "sources": setStreamSources(event.sources); break;
              case "done": finishStreaming(event.conversation_id); break;
              case "error": setError(event.message); break;
            }
          },
          controller.signal
        );
      } catch (err: unknown) {
        const e = err as Error;
        if (e.name === "AbortError") return;
        setError(e.message || "An error occurred while generating a response.");
      } finally {
        abortRef.current = null;
      }
    },
    [isStreaming, activeConversationId, addUserMessage, startStreaming, appendStreamChunk, setStreamSources, finishStreaming, setError]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    stopStreaming();
  }, [stopStreaming]);

  return {
    messages, streamingContent, isStreaming, sources, error, activeConversationId,
    send, stop, setActiveConversation, loadMessages, clearChat,
    setError,
  };
}
