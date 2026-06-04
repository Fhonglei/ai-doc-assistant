"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBanner } from "@/components/common/ErrorBanner";

interface ChatPanelProps {
  onConversationUpdated?: () => void;
}

export function ChatPanel({ onConversationUpdated }: ChatPanelProps) {
  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    send,
    stop,
    setError,
  } = useChat();

  const wasStreaming = useRef(false);

  useEffect(() => {
    if (wasStreaming.current && !isStreaming) {
      onConversationUpdated?.();
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming, onConversationUpdated]);

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="px-4 pt-3">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {hasMessages ? (
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />
      ) : (
        <EmptyState onSelectPrompt={(text) => send(text)} />
      )}

      <ChatInput
        onSend={(msg) => send(msg)}
        onStop={stop}
        isStreaming={isStreaming}
      />
    </div>
  );
}
