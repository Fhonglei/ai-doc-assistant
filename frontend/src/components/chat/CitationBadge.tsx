"use client";

import { useState, useRef, useEffect } from "react";
import type { Source } from "@/lib/types";

interface CitationBadgeProps {
  index: number;
  sources: Source[];
}

export function CitationBadge({ index, sources }: CitationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  const source = index >= 0 && index < sources.length ? sources[index] : null;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!source) {
    return (
      <sup className="text-blue-500 font-bold text-xs cursor-default">
        [{index + 1}]
      </sup>
    );
  }

  return (
    <span className="relative inline">
      <button
        ref={badgeRef}
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-500 hover:text-blue-700 font-bold text-xs cursor-pointer hover:underline"
        title={`Source: ${source.document_name}${source.page_number ? ` p.${source.page_number}` : ""}`}
      >
        [{index + 1}]
      </button>
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-3 text-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {source.document_name}
              {source.page_number ? ` · Page ${source.page_number}` : ""}
            </span>
            <span className="text-gray-400">
              Relevance: {(source.relevance_score * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
            {source.text}
          </p>
        </div>
      )}
    </span>
  );
}
