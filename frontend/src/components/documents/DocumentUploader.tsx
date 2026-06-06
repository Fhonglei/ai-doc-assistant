"use client";

import { useState, useCallback } from "react";
import type { RefObject } from "react";

interface UploadEntry {
  id: string;
  file: File;
  progress: number;
  status: string;
  error?: string;
}

interface DocumentUploaderProps {
  onUpload: (file: File) => Promise<void>;
  uploads: UploadEntry[];
  inputRef: RefObject<HTMLInputElement>;
}

export function DocumentUploader({ onUpload, uploads, inputRef }: DocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) {
        Array.from(e.dataTransfer.files).forEach((f) => onUpload(f));
      }
    },
    [onUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        Array.from(e.target.files).forEach((f) => onUpload(f));
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [onUpload, inputRef]
  );

  return (
    <div className="mb-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
          isDragOver
            ? "drop-glow border-[var(--accent)] bg-accent-soft"
            : "border-subtle bg-surface-muted/50 hover:border-[var(--accent)]/50"
        }`}
      >
        <p className="text-sm font-medium text-primary">拖放文件到此处</p>
        <p className="mt-1 text-[10px] text-muted">或点击选择 · PDF / DOCX / TXT · 最大 50MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
        className="hidden"
        multiple
      />

      {uploads.length > 0 && (
        <ul className="mt-2 space-y-1">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded-lg bg-surface-muted px-2 py-1.5 text-[10px]"
            >
              <span className="text-muted">
                {u.status === "uploading"
                  ? "↑"
                  : u.status === "processing"
                    ? "…"
                    : u.status === "ready"
                      ? "✓"
                      : "!"}
              </span>
              <span className="min-w-0 flex-1 truncate text-secondary">{u.file.name}</span>
              {u.error && (
                <span className="max-w-[80px] truncate text-[var(--danger)]">{u.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
