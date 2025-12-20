import { eq } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { Env, ServiceResponse } from '../../types';
import { attachments, taskComments, tasks } from '../../db/schema';
import type { Attachment, Task } from '../../types/models';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Base File Upload Service
 *
 * Provides common functionality for file upload operations:
 * - DB query helpers (getAttachment, getAttachmentWithTaskContext, etc.)
 * - R2 signed URL generation
 * - Error handling utilities
 * - File type validation
 */
export abstract class BaseFileUploadService {
  protected db: DbClient;
  protected env: Env;

  // Maximum file size: 25MB
  protected readonly MAX_FILE_SIZE = 25 * 1024 * 1024;

  // Allowed MIME types
  protected readonly ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'image/heic',
    // Audio
    'audio/wav',
    'audio/x-wav',
    'audio/midi',
    'audio/x-midi',
    'audio/mpeg',
    'audio/mp3',
    // Video
    'video/mpeg',
    'video/mp4',
    'video/quicktime',
    // Documents
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/csv',
    'application/pdf',
  ];

  constructor(db: DbClient, env: Env) {
    this.db = db;
    this.env = env;
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(attachmentId: string): Promise<ServiceResponse<Attachment>> {
    try {
      const attachment = await this.db.query.attachments.findFirst({
        where: eq(attachments.id, attachmentId),
      });

      if (!attachment) {
        return this.error('Attachment not found', 'NOT_FOUND');
      }

      return this.success(attachment as Attachment);
    } catch (error) {
      return this.handleError(error, 'Failed to get attachment');
    }
  }

  /**
   * Get attachment with task context
   * Resolves the task ID from either direct task attachment or comment attachment
   */
  async getAttachmentWithTaskContext(
    attachmentId: string
  ): Promise<ServiceResponse<{ attachment: Attachment; task: Task }>> {
    try {
      // Fetch attachment
      const attachmentResult = await this.getAttachment(attachmentId);
      if (!attachmentResult.success) {
        return attachmentResult as ServiceResponse<never>;
      }

      const attachment = attachmentResult.data!;

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

      // Get task
      const task = await this.db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (!task) {
        return this.error('Task not found', 'NOT_FOUND');
      }

      return this.success({ attachment, task: task as Task });
    } catch (error) {
      return this.handleError(error, 'Failed to get attachment with task context');
    }
  }

  /**
   * Get project ID from task or comment ID
   */
  async getProjectIdFromContext(
    taskId?: string,
    commentId?: string
  ): Promise<ServiceResponse<string>> {
    try {
      if (taskId) {
        const task = await this.db.query.tasks.findFirst({
          where: eq(tasks.id, taskId),
        });

        if (!task) {
          return this.error('Task not found', 'NOT_FOUND');
        }

        return this.success(task.projectId);
      } else if (commentId) {
        const comment = await this.db.query.taskComments.findFirst({
          where: eq(taskComments.id, commentId),
        });

        if (!comment) {
          return this.error('Comment not found', 'NOT_FOUND');
        }

        const task = await this.db.query.tasks.findFirst({
          where: eq(tasks.id, comment.taskId),
        });

        if (!task) {
          return this.error('Task not found', 'NOT_FOUND');
        }

        return this.success(task.projectId);
      }

      return this.error('Either taskId or commentId must be provided', 'INVALID_INPUT');
    } catch (error) {
      return this.handleError(error, 'Failed to get project ID');
    }
  }

  /**
   * Validate file type
   */
  protected validateFileType(mimeType: string): boolean {
    return this.ALLOWED_MIME_TYPES.includes(mimeType);
  }

  /**
   * Generate R2 pre-signed URL using AWS S3-compatible API
   * R2 is fully S3-compatible for pre-signed URLs
   */
  protected async generateR2SignedUrl(
    key: string,
    method: 'PUT' | 'GET',
    expiresIn: number
  ): Promise<string> {
    // Check if R2 credentials are configured
    if (!this.env.R2_ACCOUNT_ID || !this.env.R2_ACCESS_KEY_ID || !this.env.R2_SECRET_ACCESS_KEY || !this.env.R2_BUCKET_NAME) {
      throw new Error(
        'R2 credentials not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your environment variables.'
      );
    }

    // Create S3 client for R2
    // R2 endpoint format: https://<accountId>.r2.cloudflarestorage.com
    const s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' as region
      endpoint: `https://${this.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.env.R2_ACCESS_KEY_ID,
        secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
      },
    });

    try {
      if (method === 'PUT') {
        // Generate pre-signed PUT URL for upload
        const command = new PutObjectCommand({
          Bucket: this.env.R2_BUCKET_NAME,
          Key: key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn, // seconds
        });

        return signedUrl;
      } else {
        // Generate pre-signed GET URL for download
        const command = new GetObjectCommand({
          Bucket: this.env.R2_BUCKET_NAME,
          Key: key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn, // seconds
        });

        return signedUrl;
      }
    } catch (error) {
      console.error('[generateR2SignedUrl] Error:', error);
      throw new Error(`Failed to generate R2 signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create success response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create error response
   */
  protected error(error: string, code?: string): ServiceResponse<never> {
    return {
      success: false,
      error,
      code,
    };
  }

  /**
   * Handle unexpected errors
   */
  protected handleError(error: unknown, context: string): ServiceResponse<never> {
    console.error(`[${context}] Error:`, error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return this.error(message, 'INTERNAL_ERROR');
  }
}
