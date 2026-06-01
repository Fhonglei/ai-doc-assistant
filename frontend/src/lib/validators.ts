import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, SUPPORTED_FORMATS_LABEL } from "./constants";

export function validateFile(file: File): string | null {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
    // Also check extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".docx", ".txt"].includes(ext)) {
      return `Unsupported file type. Accepted: ${SUPPORTED_FORMATS_LABEL}`;
    }
  }

  // Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File too large (${sizeMB}MB). Maximum is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`;
  }

  // Check empty
  if (file.size === 0) {
    return "File is empty.";
  }

  return null;
}
