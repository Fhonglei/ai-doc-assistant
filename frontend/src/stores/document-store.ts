import { create } from "zustand";
import type { Document } from "@/lib/types";

interface UploadEntry {
  id: string;
  file: File;
  progress: number; // 0-100
  status: "uploading" | "processing" | "ready" | "error";
  error?: string;
  document?: Document;
}

interface DocumentState {
  documents: Document[];
  uploads: UploadEntry[];
  selectedDocumentIds: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (docs: Document[]) => void;
  upsertDocument: (doc: Document) => void;
  toggleDocumentSelection: (id: string) => void;
  selectAllDocuments: () => void;
  clearDocumentSelection: () => void;
  addUpload: (file: File) => string;
  updateUploadProgress: (id: string, progress: number) => void;
  updateUploadStatus: (
    id: string,
    status: UploadEntry["status"],
    document?: Document,
    error?: string
  ) => void;
  removeUpload: (id: string) => void;
  removeDocument: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

let uploadIdCounter = 0;
function genUploadId(file: File): string {
  uploadIdCounter += 1;
  return `upload_${Date.now()}_${uploadIdCounter}_${file.size}`;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  uploads: [],
  selectedDocumentIds: [],
  isLoading: false,
  error: null,

  setDocuments: (docs) =>
    set({
      documents: docs,
      selectedDocumentIds: get().selectedDocumentIds.filter((id) =>
        docs.some((d) => d.id === id)
      ),
    }),

  upsertDocument: (doc) =>
    set((state) => ({
      documents: [doc, ...state.documents.filter((d) => d.id !== doc.id)],
    })),

  toggleDocumentSelection: (id) =>
    set((state) => {
      const selected = state.selectedDocumentIds.includes(id)
        ? state.selectedDocumentIds.filter((x) => x !== id)
        : [...state.selectedDocumentIds, id];
      return { selectedDocumentIds: selected };
    }),

  selectAllDocuments: () =>
    set((state) => ({
      selectedDocumentIds: state.documents
        .filter((d) => d.status === "ready")
        .map((d) => d.id),
    })),

  clearDocumentSelection: () => set({ selectedDocumentIds: [] }),

  addUpload: (file) => {
    const id = genUploadId(file);
    set((state) => ({
      uploads: [
        ...state.uploads,
        { id, file, progress: 0, status: "uploading" },
      ],
    }));
    return id;
  },

  updateUploadProgress: (id, progress) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, progress } : u
      ),
    })),

  updateUploadStatus: (id, status, document, error) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, status, document, error } : u
      ),
      documents: document
        ? [document, ...state.documents.filter((d) => d.id !== document.id)]
        : state.documents,
    })),

  removeUpload: (id) =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      selectedDocumentIds: state.selectedDocumentIds.filter((x) => x !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
