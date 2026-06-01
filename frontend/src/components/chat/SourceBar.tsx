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
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs">📎</span>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Sources
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <div key={`${source.document_id}-${source.chunk_index}`} className="relative">
            <button
              onClick={() => setExpandedSource(expandedSource === i ? null : i)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300
                border border-indigo-200 dark:border-indigo-800
                hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            >
              <span className="max-w-[140px] truncate">
                {source.document_name}
                {source.page_number ? ` · p.${source.page_number}` : ""}
              </span>
              <span className="text-indigo-400 text-[10px]">
                {(source.relevance_score * 100).toFixed(0)}%
              </span>
            </button>

            {expandedSource === i && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {source.document_name}
                  </span>
                  <span className="text-slate-400">
                    Relevance: {(source.relevance_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
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
