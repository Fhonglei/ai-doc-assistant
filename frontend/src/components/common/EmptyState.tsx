"use client";

import { IconSparkles } from "@/components/common/Icons";

const SUGGESTIONS = [
  "总结文档的核心观点和结论",
  "列出文档中的关键数据与指标",
  "文档里有哪些待办事项或建议？",
  "用三条要点概括全文内容",
];

interface EmptyStateProps {
  onSelectPrompt?: (text: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-[var(--accent-glow)]">
          <IconSparkles className="h-10 w-10" />
        </div>
      </div>

      <h2 className="mb-2 text-2xl font-bold tracking-tight text-primary">
        向你的文档提问
      </h2>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-secondary">
        在右侧上传 PDF、DOCX 或 TXT，AI 会检索相关内容并给出带引用的回答。
        可选择特定文档，或留空以搜索全部。
      </p>

      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onSelectPrompt?.(text)}
            className="rounded-xl border border-subtle bg-surface-elevated px-4 py-3 text-left text-sm text-secondary shadow-sm transition hover:border-[var(--accent)] hover:bg-accent-soft hover:text-primary"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
