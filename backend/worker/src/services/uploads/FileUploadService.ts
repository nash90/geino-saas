import { eq } from 'drizzle-orm';
import type { ServiceResponse } from '../../types';
import { attachments, taskComments } from '../../db/schema';
import type { Attachment } from '../../types/models';
import { BaseFileUploadService } from './BaseFileUploadService';

export interface GenerateUploadUrlData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  taskId?: string;
  commentId?: string;
}

export interface GenerateUploadUrlResponse {
  uploadId: string;
  uploadUrl: string;
  fileKey: string;
}

/**
 * File Upload Service
 *
 * Handles file upload operations using Cloudflare R2 with signed URLs.
 * Supports both task-level attachments (images) and comment-level attachments (files).
 */
export class FileUploadService extends BaseFileUploadService {

  /**
   * Generate signed upload URL for R2
   */
  async generateUploadUrl(
    data: GenerateUploadUrlData
  ): Promise<ServiceResponse<GenerateUploadUrlResponse>> {
    try {
      // Validate file size
      if (data.fileSize > this.MAX_FILE_SIZE) {
        return this.error('File size exceeds 25MB limit', 'FILE_TOO_LARGE');
      }

      // Validate MIME type
      if (!this.validateFileType(data.mimeType)) {
        return this.error('File type not allowed', 'INVALID_FILE_TYPE');
      }

      // Validate that either taskId or commentId is provided
      if (!data.taskId && !data.commentId) {
        return this.error('Either taskId or commentId must be provided', 'INVALID_INPUT');
      }

      // Generate unique file key
      const uploadId = crypto.randomUUID();
      const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Get task ID for file path
      let taskIdForPath: string;
      if (data.taskId) {
        taskIdForPath = data.taskId;
      } else {
        // Get task ID from comment
        const projectIdResult = await this.getProjectIdFromContext(undefined, data.commentId);
        if (!projectIdResult.success) {
          return projectIdResult as ServiceResponse<never>;
        }

        const comment = await this.db.query.taskComments.findFirst({
          where: eq(taskComments.id, data.commentId!),
        });
        taskIdForPath = comment!.taskId;
      }

      let fileKey: string;
      if (data.taskId && !data.commentId) {
        // Task-level attachment
        fileKey = `tasks/${data.taskId}/images/${uploadId}-${sanitizedFileName}`;
      } else if (data.commentId) {
        // Comment-level attachment
        fileKey = `tasks/${taskIdForPath}/comments/${uploadId}-${sanitizedFileName}`;
      } else {
        return this.error('Invalid attachment context', 'INVALID_INPUT');
      }

      // Generate R2 signed URL for upload (PUT method, 5-minute expiration)
      const uploadUrl = await this.generateR2SignedUrl(
        fileKey,
        'PUT',
        300 // 5 minutes
      );

      return this.success({
        uploadId,
        uploadUrl,
        fileKey,
      });
    } catch (error) {
      return this.handleError(error, 'Failed to generate upload URL');
    }
  }

  /**
   * Confirm upload and create attachment record
   */
  async confirmUpload(
    userId: string,
    _uploadId: string,
    fileKey: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    taskId?: string,
    commentId?: string
  ): Promise<ServiceResponse<Attachment>> {
    try {
      // Verify file exists in R2
      const object = await this.env.ATTACHMENTS_BUCKET.head(fileKey);

      if (!object) {
        return this.error('File not found in storage', 'NOT_FOUND');
      }

      // Create attachment record
      const [attachment] = await this.db
        .insert(attachments)
        .values({
          taskId: taskId || null,
          commentId: commentId || null,
          fileName,
          fileUrl: fileKey,
          fileSize,
          mimeType,
          uploadedBy: userId,
        })
        .returning();

      return this.success(attachment as Attachment);
    } catch (error) {
      return this.handleError(error, 'Failed to confirm upload');
    }
  }

  /**
   * Generate download URL for attachment file
   */
  async generateDownloadUrl(
    fileUrl: string
  ): Promise<ServiceResponse<{ downloadUrl: string }>> {
    try {
      // Generate R2 signed URL for download (GET method, 1-hour expiration)
      const downloadUrl = await this.generateR2SignedUrl(
        fileUrl,
        'GET',
        3600 // 1 hour
      );

      return this.success({ downloadUrl });
    } catch (error) {
      return this.handleError(error, 'Failed to generate download URL');
    }
  }

  /**
   * Delete attachment from storage and database
   */
  async deleteAttachment(
    attachmentId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Get attachment to find file URL
      const attachmentResult = await this.getAttachment(attachmentId);
      if (!attachmentResult.success) {
        return attachmentResult as ServiceResponse<never>;
      }

      const attachment = attachmentResult.data!;

      // Delete from R2
      await this.env.ATTACHMENTS_BUCKET.delete(attachment.fileUrl);

      // Delete from database
      await this.db.delete(attachments).where(eq(attachments.id, attachmentId));

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to delete attachment');
    }
  }

}
