import { FileUploadService } from '../../services/uploads/FileUploadService';
import type { AuthContext } from '../../types';

/**
 * Direct upload handler - uploads file to R2 and creates attachment record
 * This replaces the three-step process with a single endpoint
 */
export async function uploadFileHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const fileUploadService = new FileUploadService(db, c.env);

  try {
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string | null;
    const commentId = formData.get('commentId') as string | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file
    if (file.size > 25 * 1024 * 1024) {
      return c.json({ error: 'File size exceeds 25MB limit' }, 413);
    }

    // Upload directly to R2
    const arrayBuffer = await file.arrayBuffer();
    const uploadId = crypto.randomUUID();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    let fileKey: string;
    if (taskId && !commentId) {
      fileKey = `tasks/${taskId}/images/${uploadId}-${sanitizedFileName}`;
    } else if (commentId) {
      const comment = await db.query.taskComments.findFirst({
        where: (taskComments, { eq }) => eq(taskComments.id, commentId),
      });
      if (!comment) {
        return c.json({ error: 'Comment not found' }, 404);
      }
      fileKey = `tasks/${comment.taskId}/comments/${uploadId}-${sanitizedFileName}`;
    } else {
      return c.json({ error: 'Either taskId or commentId must be provided' }, 400);
    }

    // Upload to R2
    await c.env.ATTACHMENTS_BUCKET.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Create attachment record using the service
    const result = await fileUploadService.confirmUpload(
      user.id,
      uploadId,
      fileKey,
      file.name,
      file.size,
      file.type,
      taskId || undefined,
      commentId || undefined
    );

    if (!result.success) {
      // If DB record creation failed, delete the file from R2
      await c.env.ATTACHMENTS_BUCKET.delete(fileKey);

      const statusCode = result.code === 'NOT_FOUND' ? 404 :
                        result.code === 'FORBIDDEN' ? 403 : 500;
      return c.json({ error: result.error }, statusCode);
    }

    return c.json({ attachment: result.data });
  } catch (error: any) {
    console.error('[uploadFileHandler] Error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
}
