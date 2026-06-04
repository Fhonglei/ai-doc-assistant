"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { MessageItem } from "./MessageItem";
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} sources={msg.sources} />
        ))}

        {isStreaming && streamingContent && (
          <div className="msg-enter flex gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white">
              AI
            </div>
            <div className="min-w-0 flex-1 prose prose-sm dark:prose-invert max-w-none text-sm text-primary">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" />
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex gap-3 px-4 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white">
              AI
            </div>
            <div className="flex items-center gap-1.5 pt-2">
              <span className="typing-dot h-2 w-2 rounded-full bg-accent" />
              <span className="typing-dot h-2 w-2 rounded-full bg-accent" />
              <span className="typing-dot h-2 w-2 rounded-full bg-accent" />
              <span className="ml-2 text-xs text-muted">正在检索并生成回答…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
