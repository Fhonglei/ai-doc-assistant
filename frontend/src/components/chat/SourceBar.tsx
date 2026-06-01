"use client";

import { useState } from "react";
import type { Source } from "@/lib/types";

interface SourceBarProps {
  sources: Source[];
}

export function SourceBar({ sources }: SourceBarProps) {
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-400 mb-1.5">📎 Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <div key={`${source.document_id}-${source.chunk_index}`} className="relative">
            <button
              onClick={() => setExpandedSource(expandedSource === i ? null : i)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span>
                {source.document_name}
                {source.page_number ? ` p.${source.page_number}` : ""}
              </span>
              <span className="text-gray-400">
                {(source.relevance_score * 100).toFixed(0)}%
              </span>
            </button>

            {expandedSource === i && (
              <div className="absolute bottom-full left-0 mb-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-3 text-xs">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {source.text}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
