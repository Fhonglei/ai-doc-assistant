import type { Document } from "@/lib/types";
import { IconTrash } from "@/components/common/Icons";

interface DocumentListProps {
  documents: Document[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DocumentList({
  documents,
  selectedIds,
  onToggleSelect,
  onDelete,
}: DocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <ul className="space-y-1">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          selected={selectedIds.includes(doc.id)}
          onToggleSelect={onToggleSelect}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function DocumentCard({
  document: doc,
  selected,
  onToggleSelect,
  onDelete,
}: {
  document: Document;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const ready = doc.status === "ready";
  const ext = doc.file_type?.toUpperCase() || "FILE";

  return (
    <li
      className={`group flex items-start gap-2 rounded-xl border px-2.5 py-2 text-xs transition ${
        selected
          ? "border-[var(--accent)] bg-accent-soft"
          : "border-transparent hover:bg-surface-muted"
      } ${!ready ? "opacity-70" : ""}`}
    >
      {ready ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(doc.id)}
          className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-subtle text-accent focus:ring-accent"
          title="纳入检索范围"
        />
      ) : (
        <span className="mt-1 h-3.5 w-3.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-primary">{doc.filename}</p>
        <p className="mt-0.5 text-[10px] text-muted">
          {ext} · {doc.chunk_count} 块
          {doc.status === "processing" && " · 处理中"}
          {doc.status === "error" && " · 失败"}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(doc.id);
        }}
        className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition hover:bg-surface-inset hover:text-[var(--danger)] group-hover:opacity-100"
        title="删除文档"
      >
        <IconTrash />
      </button>
    </li>
  );
}
