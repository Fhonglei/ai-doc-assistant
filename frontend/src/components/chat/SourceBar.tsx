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
    <div className="mt-3 border-t border-subtle pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        引用来源 ({sources.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <div key={`${source.document_id}-${source.chunk_index}`} className="relative">
            <button
              type="button"
              onClick={() => setExpandedSource(expandedSource === i ? null : i)}
              className="inline-flex max-w-[200px] items-center gap-1.5 rounded-lg border border-subtle bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent transition hover:opacity-90"
            >
              <span className="truncate">{source.document_name}</span>
              {source.page_number != null && (
                <span className="text-[10px] opacity-70">p.{source.page_number}</span>
              )}
            </button>

            {expandedSource === i && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-xl border border-subtle bg-surface-elevated p-4 text-xs shadow-panel">
                <p className="mb-2 font-semibold text-primary">{source.document_name}</p>
                <p className="max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed text-secondary">
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
