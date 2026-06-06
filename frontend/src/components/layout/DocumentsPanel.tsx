"use client";

import { useMemo, useRef, useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentStore } from "@/stores/document-store";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { IconFile } from "@/components/common/Icons";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import * as api from "@/lib/api-client";
import type { DocumentChunk } from "@/lib/types";

interface DocumentsPanelProps {
  onClose?: () => void;
}

export function DocumentsPanel({ onClose }: DocumentsPanelProps) {
  const {
    documents,
    uploads,
    upload,
    remove,
    rename,
    reindex,
    bulkRemove,
    refresh,
    clearError,
    isLoading,
    error,
  } = useDocuments();
  const selectedIds = useDocumentStore((s) => s.selectedDocumentIds);
  const toggleSelection = useDocumentStore((s) => s.toggleDocumentSelection);
  const selectAll = useDocumentStore((s) => s.selectAllDocuments);
  const clearSelection = useDocumentStore((s) => s.clearDocumentSelection);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [chunkViewer, setChunkViewer] = useState<{
    documentId: string;
    chunks: DocumentChunk[];
  } | null>(null);
  const [chunkError, setChunkError] = useState<string | null>(null);

  const readyCount = documents.filter((d) => d.status === "ready").length;
  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return documents;
    return documents.filter((doc) => doc.filename.toLowerCase().includes(normalized));
  }, [documents, query]);

  const handleRename = async (id: string, currentName: string) => {
    const nextName = window.prompt("输入新的文档名称", currentName);
    if (!nextName || nextName.trim() === currentName) return;
    await rename(id, nextName.trim());
  };

  const handleShowChunks = async (id: string) => {
    setChunkError(null);
    try {
      const result = await api.getDocumentChunks(id);
      setChunkViewer({ documentId: id, chunks: result.chunks });
    } catch (err: unknown) {
      const e = err as Error;
      setChunkError(e.message || "Failed to load chunks");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await bulkRemove(selectedIds);
    clearSelection();
  };

  return (
    <aside className="flex h-full w-full flex-col border-l border-subtle bg-surface-elevated shadow-panel">
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <IconFile className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-primary">知识库</h2>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted">
            {documents.length}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-muted"
          >
            关闭
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <DocumentUploader onUpload={upload} uploads={uploads} inputRef={uploadInputRef} />

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文档..."
          className="mb-3 w-full rounded-lg border border-subtle bg-surface-muted px-3 py-2 text-xs text-primary outline-none placeholder:text-muted focus:border-[var(--accent)]"
        />

        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} onDismiss={clearError} onRetry={refresh} />
          </div>
        )}

        {readyCount > 0 && (
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] text-muted">
              {selectedIds.length === 0
                ? "未选择时搜索全部文档"
                : `已选 ${selectedIds.length} 个文档`}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] font-medium text-accent hover:underline"
              >
                全选
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[10px] font-medium text-muted hover:underline"
                >
                  清除
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="text-[10px] font-medium text-[var(--danger)] hover:underline"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        )}

        {chunkError && (
          <div className="mb-3">
            <ErrorBanner message={chunkError} onDismiss={() => setChunkError(null)} />
          </div>
        )}

        {isLoading && documents.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">加载文档中…</p>
        ) : (
          <DocumentList
            documents={filteredDocuments}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onDelete={remove}
            onRename={handleRename}
            onReindex={reindex}
            onShowChunks={handleShowChunks}
          />
        )}

        {documents.length === 0 && !isLoading && (
          <p className="mt-4 text-center text-xs text-muted leading-relaxed px-2">
            拖拽或点击上传 PDF、DOCX、TXT，即可基于文档内容提问。
          </p>
        )}
      </div>

      {chunkViewer && (
        <div className="border-t border-subtle bg-surface-elevated p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-primary">
              Chunks ({chunkViewer.chunks.length})
            </p>
            <button
              type="button"
              onClick={() => setChunkViewer(null)}
              className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-muted"
            >
              关闭
            </button>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {chunkViewer.chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="rounded-lg border border-subtle bg-surface-muted p-2 text-[11px]"
              >
                <p className="mb-1 font-medium text-secondary">
                  #{chunk.chunk_index}
                  {chunk.page_number ? ` · page ${chunk.page_number}` : ""}
                </p>
                <p className="line-clamp-4 text-muted">{chunk.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
