import { FileText, FileImage, FileAudio, FileVideo, File } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Allowed MIME types (must match backend FileUploadService)
 */
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/webp",
  "image/heic",
  // Audio
  "audio/wav",
  "audio/x-wav",
  "audio/midi",
  "audio/x-midi",
  "audio/mpeg",
  "audio/mp3",
  // Video
  "video/mpeg",
  "video/mp4",
  "video/quicktime",
  // Documents
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "text/csv",
  "application/pdf",
];

/**
 * Format file size in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.3 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Get appropriate icon component for file type
 * @param mimeType File MIME type
 * @returns Lucide icon component
 */
export function getFileIconType(mimeType: string): string {
  if (mimeType.startsWith("image/")) {
    return "image";
  } else if (mimeType.startsWith("audio/")) {
    return "audio";
  } else if (mimeType.startsWith("video/")) {
    return "video";
  } else if (
    mimeType === "text/csv" ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("word") ||
    mimeType.includes("powerpoint") ||
    mimeType === "application/pdf"
  ) {
    return "document";
  }
  return "generic";
}

/**
 * Validate file MIME type against allowed types
 * @param mimeType File MIME type to validate
 * @returns true if allowed, false otherwise
 */
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 * @param size File size in bytes
 * @param maxMB Maximum allowed size in megabytes (default 25)
 * @returns true if within limit, false otherwise
 */
export function validateFileSize(size: number, maxMB: number = 25): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return size <= maxBytes;
}

/**
 * Get user-friendly error message for file validation
 * @param file File to validate
 * @param maxMB Maximum allowed size in MB
 * @returns Error message or null if valid
 */
export function getFileValidationError(file: File, maxMB: number = 25): string | null {
  if (!validateFileType(file.type)) {
    return `ファイル形式がサポートされていません。許可されている形式: 画像、音声、動画、ドキュメント`;
  }

  if (!validateFileSize(file.size, maxMB)) {
    return `ファイルサイズが${maxMB}MBを超えています`;
  }

  return null;
}

/**
 * Check if file is an image type
 * @param mimeType File MIME type
 * @returns true if image, false otherwise
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Get file extension from filename
 * @param filename File name
 * @returns File extension (e.g., "pdf")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}
