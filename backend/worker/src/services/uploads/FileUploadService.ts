import { eq, and, sql } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { Env, ServiceResponse } from '../../types';
import { attachments, tasks, taskComments } from '../../db/schema';
import type { Attachment, NewAttachment } from '../../types/models';

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
export class FileUploadService {
  protected db: DbClient;
  protected env: Env;

  // Maximum file size: 10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Allowed MIME types
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(db: DbClient, env: Env) {
    this.db = db;
    this.env = env;
  }

  /**
   * Generate signed upload URL for R2
   */
  async generateUploadUrl(
    userId: string,
    data: GenerateUploadUrlData
  ): Promise<ServiceResponse<GenerateUploadUrlResponse>> {
    try {
      // Validate file size
      if (data.fileSize > this.MAX_FILE_SIZE) {
        return this.error('File size exceeds 10MB limit', 'FILE_TOO_LARGE');
      }

      // Validate MIME type
      if (!this.validateFileType(data.mimeType)) {
        return this.error('File type not allowed', 'INVALID_FILE_TYPE');
      }

      // Validate that either taskId or commentId is provided
      if (!data.taskId && !data.commentId) {
        return this.error('Either taskId or commentId must be provided', 'INVALID_INPUT');
      }

      // Validate user has access to the task
      if (data.taskId) {
        const task = await this.db.query.tasks.findFirst({
          where: eq(tasks.id, data.taskId),
        });

        if (!task) {
          return this.error('Task not found', 'NOT_FOUND');
        }

        // Check if user is a member of the task's project
        const projectMember = await this.db.query.projectMembers.findFirst({
          where: and(
            sql`project_id = ${task.projectId}`,
            sql`user_id = ${userId}`
          ),
        });

        if (!projectMember) {
          return this.error('You do not have access to this task', 'FORBIDDEN');
        }
      }

      // Validate comment exists and user has access
      if (data.commentId) {
        const comment = await this.db.query.taskComments.findFirst({
          where: eq(taskComments.id, data.commentId),
        });

        if (!comment) {
          return this.error('Comment not found', 'NOT_FOUND');
        }

        // Check if user has access to the comment's task
        const task = await this.db.query.tasks.findFirst({
          where: eq(tasks.id, comment.taskId),
        });

        if (!task) {
          return this.error('Task not found', 'NOT_FOUND');
        }

        const projectMember = await this.db.query.projectMembers.findFirst({
          where: and(
            sql`project_id = ${task.projectId}`,
            sql`user_id = ${userId}`
          ),
        });

        if (!projectMember) {
          return this.error('You do not have access to this task', 'FORBIDDEN');
        }
      }

      // Generate unique file key
      const uploadId = crypto.randomUUID();
      const fileExtension = data.fileName.split('.').pop();
      const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

      let fileKey: string;
      if (data.taskId && !data.commentId) {
        // Task-level attachment
        fileKey = `tasks/${data.taskId}/images/${uploadId}-${sanitizedFileName}`;
      } else if (data.commentId) {
        // Comment-level attachment
        const comment = await this.db.query.taskComments.findFirst({
          where: eq(taskComments.id, data.commentId),
        });
        fileKey = `tasks/${comment!.taskId}/comments/${uploadId}-${sanitizedFileName}`;
      } else {
        return this.error('Invalid attachment context', 'INVALID_INPUT');
      }

      // Generate R2 signed URL for upload (PUT method, 5-minute expiration)
      const uploadUrl = await this.generateR2SignedUrl(
        this.env.ATTACHMENTS_BUCKET,
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
    uploadId: string,
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
   * Generate download URL for attachment
   */
  async generateDownloadUrl(
    userId: string,
    attachmentId: string
  ): Promise<ServiceResponse<{ downloadUrl: string }>> {
    try {
      // Fetch attachment
      const attachment = await this.db.query.attachments.findFirst({
        where: eq(attachments.id, attachmentId),
      });

      if (!attachment) {
        return this.error('Attachment not found', 'NOT_FOUND');
      }

      // Determine task ID from attachment
      let taskId: string | null = null;
      if (attachment.taskId) {
        taskId = attachment.taskId;
      } else if (attachment.commentId) {
        const comment = await this.db.query.taskComments.findFirst({
          where: eq(taskComments.id, attachment.commentId),
        });
        if (comment) {
          taskId = comment.taskId;
        }
      }

      if (!taskId) {
        return this.error('Cannot determine task for attachment', 'INVALID_STATE');
      }

      // Verify user has access to the task
      const task = await this.db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (!task) {
        return this.error('Task not found', 'NOT_FOUND');
      }

      const projectMember = await this.db.query.projectMembers.findFirst({
        where: and(
          sql`project_id = ${task.projectId}`,
          sql`user_id = ${userId}`
        ),
      });

      if (!projectMember) {
        return this.error('You do not have access to this attachment', 'FORBIDDEN');
      }

      // Generate R2 signed URL for download (GET method, 1-hour expiration)
      const downloadUrl = await this.generateR2SignedUrl(
        this.env.ATTACHMENTS_BUCKET,
        attachment.fileUrl,
        'GET',
        3600 // 1 hour
      );

      return this.success({ downloadUrl });
    } catch (error) {
      return this.handleError(error, 'Failed to generate download URL');
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(
    userId: string,
    attachmentId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Fetch attachment
      const attachment = await this.db.query.attachments.findFirst({
        where: eq(attachments.id, attachmentId),
      });

      if (!attachment) {
        return this.error('Attachment not found', 'NOT_FOUND');
      }

      // Check if user is the uploader or a Project Manager
      const isUploader = attachment.uploadedBy === userId;

      if (!isUploader) {
        // Determine task ID
        let taskId: string | null = null;
        if (attachment.taskId) {
          taskId = attachment.taskId;
        } else if (attachment.commentId) {
          const comment = await this.db.query.taskComments.findFirst({
            where: eq(taskComments.id, attachment.commentId),
          });
          if (comment) {
            taskId = comment.taskId;
          }
        }

        if (!taskId) {
          return this.error('Cannot determine task for attachment', 'INVALID_STATE');
        }

        // Check if user is a Project Manager
        const task = await this.db.query.tasks.findFirst({
          where: eq(tasks.id, taskId),
        });

        if (!task) {
          return this.error('Task not found', 'NOT_FOUND');
        }

        const projectMember = await this.db.query.projectMembers.findFirst({
          where: and(
            sql`project_id = ${task.projectId}`,
            sql`user_id = ${userId}`
          ),
        });

        if (!projectMember || projectMember.projectRoleCode !== 1) {
          return this.error('Only the uploader or Project Managers can delete attachments', 'FORBIDDEN');
        }
      }

      // Delete from R2
      await this.env.ATTACHMENTS_BUCKET.delete(attachment.fileUrl);

      // Delete from database
      await this.db.delete(attachments).where(eq(attachments.id, attachmentId));

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to delete attachment');
    }
  }

  /**
   * Validate file type
   */
  private validateFileType(mimeType: string): boolean {
    return this.ALLOWED_MIME_TYPES.includes(mimeType);
  }

  /**
   * Generate R2 signed URL
   * Note: R2 uses AWS S3-compatible API for signed URLs
   */
  private async generateR2SignedUrl(
    bucket: R2Bucket,
    key: string,
    method: 'PUT' | 'GET',
    expiresIn: number
  ): Promise<string> {
    // Generate signed URL using R2's httpMetadata
    // This is a simplified implementation - you may need to adjust based on Cloudflare's R2 API
    const url = await bucket.createMultipartUpload(key);

    // For now, return a placeholder URL structure
    // In production, you'll need to implement proper signed URL generation
    // using Cloudflare's R2 API or AWS S3-compatible signing
    return `https://r2-signed-url.example.com/${key}?method=${method}&expires=${expiresIn}`;
  }

  /**
   * Create success response
   */
  private success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create error response
   */
  private error(error: string, code?: string): ServiceResponse<never> {
    return {
      success: false,
      error,
      code,
    };
  }

  /**
   * Handle unexpected errors
   */
  private handleError(error: unknown, context: string): ServiceResponse<never> {
    console.error(`[${context}] Error:`, error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return this.error(message, 'INTERNAL_ERROR');
  }
}
