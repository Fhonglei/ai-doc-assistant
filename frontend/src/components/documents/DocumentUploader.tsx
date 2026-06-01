"use client";

import { useState, useCallback, type RefObject } from "react";
import { SUPPORTED_FORMATS_LABEL } from "@/lib/constants";

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
      const files = Array.from(e.dataTransfer.files);
      files.forEach((f) => onUpload(f));
    },
    [onUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((f) => onUpload(f));
      if (inputRef.current) inputRef.current.value = "";
    },
    [onUpload, inputRef]
  );

  return (
    <div className="mb-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors text-xs
          ${isDragOver
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }
        `}
      >
        <p className="text-gray-500 dark:text-gray-400">
          📤 Drop files or click
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
          {SUPPORTED_FORMATS_LABEL}
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
        <div className="mt-2 space-y-1">
          {uploads.map((u) => (
            <div key={u.file.name} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                  {u.file.name}
                </span>
                <span
                  className={`flex-shrink-0 ml-2 ${
                    u.status === "ready"
                      ? "text-green-500"
                      : u.status === "error"
                      ? "text-red-500"
                      : "text-blue-500"
                  }`}
                >
                  {u.status === "uploading" ? "⏳" : ""}
                  {u.status === "processing" ? "⚙️" : ""}
                  {u.status === "ready" ? "✅" : ""}
                  {u.status === "error" ? "❌" : ""}
                </span>
              </div>
              {u.error && (
                <p className="text-red-500 text-[10px] mt-0.5 truncate">{u.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
