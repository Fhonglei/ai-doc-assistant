"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { CitationBadge } from "./CitationBadge";
import { SourceBar } from "./SourceBar";
import type { Message, Source } from "@/lib/types";

interface MessageItemProps {
  message: Message;
  sources?: Source[];
}

export function MessageItem({ message, sources }: MessageItemProps) {
  const isUser = message.role === "user";

  const contentWithCitations = useMemo(() => {
    if (isUser) return null;

    const parts = message.content.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match && sources && sources.length > 0) {
        const idx = parseInt(match[1], 10) - 1;
        return (
          <CitationBadge key={`cite-${i}`} index={idx} sources={sources} />
        );
      }
      return <ReactMarkdown key={`md-${i}`}>{part}</ReactMarkdown>;
    });
  }, [message.content, isUser, sources]);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`msg-enter flex gap-3 px-4 py-3 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${
          isUser ? "bg-slate-600" : "bg-accent"
        }`}
      >
        {isUser ? "我" : "AI"}
      </div>

      <div className={`min-w-0 flex-1 ${isUser ? "flex flex-col items-end" : ""}`}>
        <div
          className={`mb-1 flex items-center gap-2 text-[10px] text-muted ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          <span className="font-medium text-secondary">
            {isUser ? "你" : "助手"}
          </span>
          <span>{time}</span>
        </div>

        <div
          className={`text-sm leading-relaxed ${
            isUser
              ? "max-w-[85%] rounded-2xl rounded-tr-md bg-accent px-4 py-3 text-white"
              : "prose prose-sm dark:prose-invert max-w-none text-primary"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            contentWithCitations
          )}
        </div>

        {!isUser && sources && sources.length > 0 && (
          <SourceBar sources={sources} />
        )}
      </div>
    </div>
  );
}
