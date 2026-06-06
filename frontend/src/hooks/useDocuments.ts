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
  const upsertDocument = useDocumentStore((s) => s.upsertDocument);
  const setLoading = useDocumentStore((s) => s.setLoading);
  const setError = useDocumentStore((s) => s.setError);
  const addUpload = useDocumentStore((s) => s.addUpload);
  const updateUploadProgress = useDocumentStore((s) => s.updateUploadProgress);
  const updateUploadStatus = useDocumentStore((s) => s.updateUploadStatus);
  const removeUpload = useDocumentStore((s) => s.removeUpload);
  const removeDocument = useDocumentStore((s) => s.removeDocument);

  const fetched = useRef(false);

  const fetchDocuments = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.listDocuments();
        setDocuments(result.documents);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    },
    [setDocuments, setLoading, setError]
  );

  // Fetch documents once on mount
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchDocuments();
  }, [fetchDocuments]);

  const pollDocumentUntilSettled = useCallback(
    async (docId: string, uploadId?: string) => {
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const doc = await api.getDocument(docId);
        upsertDocument(doc);

        if (uploadId) {
          updateUploadProgress(uploadId, Math.min(95, 45 + attempt * 2));
          updateUploadStatus(uploadId, doc.status, doc, doc.error_message || undefined);
        }

        if (doc.status === "ready" || doc.status === "error") {
          return doc;
        }
      }

      throw new Error("Document processing timed out. Refresh the document list to check status.");
    },
    [updateUploadProgress, updateUploadStatus, upsertDocument]
  );

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const uploadId = addUpload(file);
      updateUploadProgress(uploadId, 30);
      updateUploadStatus(uploadId, "processing");

      try {
        const doc = await api.uploadDocument(file);
        upsertDocument(doc);

        const finalDoc =
          doc.status === "processing"
            ? await pollDocumentUntilSettled(doc.id, uploadId)
            : doc;

        updateUploadProgress(uploadId, 100);

        if (finalDoc.status === "ready") {
          updateUploadStatus(uploadId, "ready", finalDoc);
          setTimeout(() => removeUpload(uploadId), 3000);
        } else {
          const message = finalDoc.error_message || "Document processing failed";
          updateUploadStatus(uploadId, "error", finalDoc, message);
          setError(message);
        }
      } catch (err: unknown) {
        const e = err as Error;
        updateUploadStatus(uploadId, "error", undefined, e.message);
        setError(e.message || "Upload failed");
      }
    },
    [
      addUpload,
      pollDocumentUntilSettled,
      removeUpload,
      setError,
      updateUploadProgress,
      updateUploadStatus,
      upsertDocument,
    ]
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

  const rename = useCallback(
    async (id: string, filename: string) => {
      try {
        const doc = await api.renameDocument(id, filename);
        upsertDocument(doc);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Failed to rename document");
      }
    },
    [setError, upsertDocument]
  );

  const reindex = useCallback(
    async (id: string) => {
      try {
        const doc = await api.reindexDocument(id);
        upsertDocument(doc);
        await pollDocumentUntilSettled(id);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Failed to reindex document");
      }
    },
    [pollDocumentUntilSettled, setError, upsertDocument]
  );

  const bulkRemove = useCallback(
    async (ids: string[]) => {
      try {
        await api.bulkDeleteDocuments(ids);
        ids.forEach(removeDocument);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Failed to delete documents");
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
    rename,
    reindex,
    bulkRemove,
    refresh: fetchDocuments,
    clearError: () => setError(null),
  };
}
