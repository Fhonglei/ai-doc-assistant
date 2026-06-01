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

  // Parse citations in AI messages: replace [N] with CitationBadge components
  const contentWithCitations = useMemo(() => {
    if (isUser) return message.content;

    const parts = message.content.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match && sources && sources.length > 0) {
        const idx = parseInt(match[1]) - 1;
        return (
          <CitationBadge
            key={`cite-${i}`}
            index={idx}
            sources={sources}
          />
        );
      }
      return <ReactMarkdown key={`md-${i}`}>{part}</ReactMarkdown>;
    });
  }, [message.content, isUser, sources]);

  return (
    <div
      className={`flex gap-3 px-4 py-3 ${
        isUser
          ? "bg-white dark:bg-gray-900"
          : "bg-gray-50 dark:bg-gray-950"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-green-500 text-white"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm leading-relaxed ${
            isUser
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-800 dark:text-gray-200 prose dark:prose-invert prose-sm max-w-none"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            contentWithCitations
          )}
        </div>

        {/* Source bar (AI messages only) */}
        {!isUser && sources && sources.length > 0 && (
          <SourceBar sources={sources} />
        )}
      </div>
    </div>
  );
}
