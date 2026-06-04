"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { IconSend } from "@/components/common/Icons";
import { useDocumentStore } from "@/stores/document-store";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectedCount = useDocumentStore((s) => s.selectedDocumentIds.length);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  }, [input, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const hasText = input.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-subtle bg-surface-elevated/90 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        {selectedCount > 0 && (
          <p className="mb-2 text-center text-[10px] text-muted">
            检索范围：已选 {selectedCount} 个文档
          </p>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-subtle bg-surface-muted p-2 transition focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题，基于已上传文档回答…"
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="shrink-0 rounded-xl bg-[var(--danger)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              停止
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasText}
              aria-label="发送"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                hasText
                  ? "bg-accent text-white hover:opacity-90 active:scale-95"
                  : "bg-surface-inset text-muted cursor-not-allowed"
              }`}
            >
              <IconSend className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[10px] text-muted">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
