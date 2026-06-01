"use client";

import { useState, useCallback } from "react";
import type { RefObject } from "react";

interface UploadEntry {
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
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all text-xs
          ${isDragOver
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 drop-glow"
            : "border-slate-300 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/50"
          }
        `}
      >
        <div className="text-2xl mb-1">📤</div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Drop files or click to upload
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">
          PDF, DOCX, TXT · Max 50MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
        className="hidden"
        multiple
      />

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {uploads.map((u) => (
            <div key={u.file.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
              <span className="text-sm flex-shrink-0">
                {u.status === "uploading" ? "⏳" : u.status === "processing" ? "⚙️" : u.status === "ready" ? "✅" : "❌"}
              </span>
              <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{u.file.name}</span>
              {u.error && <span className="text-red-500 text-[10px] truncate max-w-[100px]">{u.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
