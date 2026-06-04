import { create } from "zustand";
import type { Document } from "@/lib/types";

interface UploadEntry {
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
  toggleDocumentSelection: (id: string) => void;
  selectAllDocuments: () => void;
  clearDocumentSelection: () => void;
  addUpload: (file: File) => void;
  updateUploadProgress: (fileName: string, progress: number) => void;
  updateUploadStatus: (
    fileName: string,
    status: UploadEntry["status"],
    document?: Document,
    error?: string
  ) => void;
  removeUpload: (fileName: string) => void;
  removeDocument: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
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

  addUpload: (file) =>
    set((state) => ({
      uploads: [
        ...state.uploads,
        { file, progress: 0, status: "uploading" },
      ],
    })),

  updateUploadProgress: (fileName, progress) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.file.name === fileName ? { ...u, progress } : u
      ),
    })),

  updateUploadStatus: (fileName, status, document, error) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.file.name === fileName ? { ...u, status, document, error } : u
      ),
      documents: document
        ? [document, ...state.documents]
        : state.documents,
    })),

  removeUpload: (fileName) =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.file.name !== fileName),
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      selectedDocumentIds: state.selectedDocumentIds.filter((x) => x !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
