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
        const idx = parseInt(match[1]) - 1;
        return (
          <CitationBadge key={`cite-${i}`} index={idx} sources={sources} />
        );
      }
      return <ReactMarkdown key={`md-${i}`}>{part}</ReactMarkdown>;
    });
  }, [message.content, isUser, sources]);

  return (
    <div className="msg-enter flex gap-4 px-5 py-4">
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white"
            : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isUser ? "You" : "Assistant"}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div
          className={`text-sm leading-relaxed ${
            isUser
              ? "bg-indigo-50 dark:bg-indigo-900/10 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-md px-4 py-3 inline-block max-w-[85%]"
              : "text-slate-700 dark:text-slate-300 prose dark:prose-invert prose-sm max-w-none"
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
