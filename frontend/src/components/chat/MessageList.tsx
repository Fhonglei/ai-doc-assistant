"use client";

import { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";
import { Spinner } from "@/components/common/Spinner";
import type { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
}

export function MessageList({
  messages,
  streamingContent,
  isStreaming,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Track if user is at the bottom (for auto-scroll behavior)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom when new content arrives (only if user is at bottom)
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          sources={msg.sources}
        />
      ))}

      {/* Streaming content */}
      {isStreaming && streamingContent && (
        <div className="flex gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-950">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
            AI
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed prose dark:prose-invert prose-sm max-w-none">
              {streamingContent}
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator (no content yet) */}
      {isStreaming && !streamingContent && (
        <div className="flex gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-950">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
            AI
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Spinner className="h-4 w-4" />
            Thinking...
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
