import type { Document } from "@/lib/types";

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onDelete={onDelete} />
      ))}
    </div>
  );
}

function DocumentCard({ document: doc, onDelete }: { document: Document; onDelete: (id: string) => void }) {
  const icon = doc.file_type === "pdf" ? "📕" : doc.file_type === "docx" ? "📘" : "📄";

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group text-xs">
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-gray-700 dark:text-gray-300 truncate font-medium">
          {doc.filename}
        </p>
        <p className="text-gray-400 text-[10px]">
          {doc.chunk_count} chunks
          {doc.status === "processing" && " · Processing..."}
          {doc.status === "error" && " · Error"}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        title="Delete document"
      >
        🗑️
      </button>
    </div>
  );
}
