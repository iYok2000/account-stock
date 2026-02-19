/**
 * File validation for upload (size, type).
 * Server-side can add magic-byte checks when API is ready.
 */

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_EXTENSIONS = [".csv", ".xlsx"] as const;
export const ALLOWED_CONTENT_TYPES = new Set([
  "text/csv",
  "text/plain",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export interface ValidationResult {
  valid: boolean;
  fileType: "csv" | "xlsx" | "unknown";
  sizeBytes: number;
  error?: string;
}

export function validateFile(
  file: File
): ValidationResult {
  const sizeBytes = file.size;

  if (sizeBytes === 0) {
    return {
      valid: false,
      fileType: "unknown",
      sizeBytes,
      error: "File is empty",
    };
  }

  if (sizeBytes > MAX_FILE_SIZE) {
    return {
      valid: false,
      fileType: "unknown",
      sizeBytes,
      error: `File exceeds 10MB limit (got ${(sizeBytes / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  const ext = file.name.toLowerCase().split(".").pop();
  let fileType: "csv" | "xlsx" | "unknown" = "unknown";
  if (ext === "csv" || ext === "txt") fileType = "csv";
  else if (ext === "xlsx" || ext === "xls") fileType = "xlsx";

  if (fileType === "unknown") {
    return {
      valid: false,
      fileType: "unknown",
      sizeBytes,
      error: "Unsupported file type. Allowed: .csv, .xlsx",
    };
  }

  return { valid: true, fileType, sizeBytes };
}
