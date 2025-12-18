import { apiClient } from './client';
import axios from 'axios';
import type { Attachment } from '../types/entities';
import type {
  GenerateUploadUrlRequest,
  GenerateUploadUrlResponse,
  ConfirmUploadRequest,
  GetDownloadUrlResponse,
} from '../types/api';

export const uploadsApi = {
  // ============================================================================
  // Upload Operations (Three-Step Pre-Signed URL Approach)
  // ============================================================================

  /**
   * Step 1: Generate pre-signed upload URL from backend
   * This URL allows direct client-to-R2 upload, bypassing Worker size limits
   */
  generateUploadUrl: async (
    data: GenerateUploadUrlRequest
  ): Promise<GenerateUploadUrlResponse> => {
    const response = await apiClient.post('/api/uploads/generate-upload-url', data);
    return response.data;
  },

  /**
   * Step 2: Upload file directly to R2 using signed URL
   * This bypasses the backend and uploads directly to Cloudflare R2
   */
  uploadFile: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    try {
      const response = await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: onProgress
          ? (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
              }
            }
          : undefined,
      });

      // Verify upload was successful
      if (response.status !== 200) {
        throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  },

  /**
   * Step 3: Confirm upload completion and create attachment record
   */
  confirmUpload: async (
    data: ConfirmUploadRequest
  ): Promise<Attachment> => {
    const response = await apiClient.post('/api/uploads/confirm', data);
    return response.data.attachment;
  },

  /**
   * Get signed download URL for an attachment
   */
  getDownloadUrl: async (attachmentId: string): Promise<string> => {
    const response = await apiClient.get(`/api/uploads/${attachmentId}/download-url`);
    return response.data.downloadUrl;
  },

  /**
   * Delete an attachment (owner or PM+)
   */
  deleteAttachment: async (attachmentId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/uploads/${attachmentId}`);
    return response.data;
  },

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Complete upload flow: generate URL, upload file, confirm
   * This is the recommended way to upload files
   */
  uploadAndConfirm: async (
    file: File,
    taskId?: string,
    commentId?: string
  ): Promise<Attachment> => {
    // Step 1: Generate upload URL
    const { uploadId, uploadUrl, fileKey } = await uploadsApi.generateUploadUrl({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      taskId,
      commentId,
    });

    // Step 2: Upload file to R2
    await uploadsApi.uploadFile(uploadUrl, file);

    // Step 3: Confirm upload and create attachment record
    const attachment = await uploadsApi.confirmUpload({
      uploadId,
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      taskId,
      commentId,
    });

    return attachment;
  },

  /**
   * Download an attachment
   * Gets the signed URL and opens in new tab
   */
  downloadAttachment: async (attachmentId: string, fileName: string): Promise<void> => {
    const downloadUrl = await uploadsApi.getDownloadUrl(attachmentId);

    // Open in new tab to prevent user from navigating away
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  },
};
