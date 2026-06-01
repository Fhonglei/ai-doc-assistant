import { useCallback, useEffect, useRef } from "react";
import { useDocumentStore } from "@/stores/document-store";
import * as api from "@/lib/api-client";
import { validateFile } from "@/lib/validators";

export function useDocuments() {
  // Destructure individual selectors — Zustand actions are referentially stable
  const documents = useDocumentStore((s) => s.documents);
  const uploads = useDocumentStore((s) => s.uploads);
  const isLoading = useDocumentStore((s) => s.isLoading);
  const error = useDocumentStore((s) => s.error);
  const setDocuments = useDocumentStore((s) => s.setDocuments);
  const setLoading = useDocumentStore((s) => s.setLoading);
  const setError = useDocumentStore((s) => s.setError);
  const addUpload = useDocumentStore((s) => s.addUpload);
  const updateUploadProgress = useDocumentStore((s) => s.updateUploadProgress);
  const updateUploadStatus = useDocumentStore((s) => s.updateUploadStatus);
  const removeUpload = useDocumentStore((s) => s.removeUpload);
  const removeDocument = useDocumentStore((s) => s.removeDocument);

  const fetched = useRef(false);

  // Fetch documents once on mount
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const result = await api.listDocuments();
        setDocuments(result.documents);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [setDocuments, setLoading, setError]);

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      addUpload(file);
      updateUploadProgress(file.name, 30);

      try {
        const doc = await api.uploadDocument(file);
        updateUploadStatus(file.name, "ready", doc);
        setTimeout(() => removeUpload(file.name), 3000);
      } catch (err: unknown) {
        const e = err as Error;
        updateUploadStatus(file.name, "error", undefined, e.message);
      }
    },
    [addUpload, updateUploadProgress, updateUploadStatus, removeUpload, setError]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await api.deleteDocument(id);
        removeDocument(id);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Failed to delete document");
      }
    },
    [removeDocument, setError]
  );

  return {
    documents,
    uploads,
    isLoading,
    error,
    upload,
    remove,
    refresh: () => {
      fetched.current = false;
    },
    clearError: () => setError(null),
  };
}
