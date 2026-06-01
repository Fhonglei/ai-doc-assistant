"use client";

import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBanner } from "@/components/common/ErrorBanner";

export function ChatPanel() {
  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    send,
    stop,
    setError,
  } = useChat();

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className="flex flex-col h-full">
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
        <EmptyState />
      )}

      <ChatInput
        onSend={(msg) => send(msg, null)}
        onStop={stop}
        isStreaming={isStreaming}
      />
    </div>
  );
}
