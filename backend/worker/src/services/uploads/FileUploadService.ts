import { eq } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { Env, ServiceResponse } from '../../types';
import { attachments, taskComments } from '../../db/schema';
import type { Attachment } from '../../types/models';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

  // Maximum file size: 25MB
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024;

  // Allowed MIME types
  private readonly ALLOWED_MIME_TYPES = [
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
   * Generate signed upload URL for R2
   * Note: Permission checks are done in the handler layer
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
   * Note: Permission checks are done in the handler layer
   */
  async generateDownloadUrl(
    fileUrl: string
  ): Promise<ServiceResponse<{ downloadUrl: string }>> {
    try {
      // Generate R2 signed URL for download (GET method, 1-hour expiration)
      const downloadUrl = await this.generateR2SignedUrl(
        this.env.ATTACHMENTS_BUCKET,
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
   * Delete attachment
   * Note: Permission checks are done in the handler layer
   */
  async deleteAttachment(
    attachmentId: string,
    fileUrl: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Delete from R2
      await this.env.ATTACHMENTS_BUCKET.delete(fileUrl);

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
   * Generate R2 pre-signed URL using AWS S3-compatible API
   * R2 is fully S3-compatible for pre-signed URLs
   */
  private async generateR2SignedUrl(
    bucket: R2Bucket,
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
