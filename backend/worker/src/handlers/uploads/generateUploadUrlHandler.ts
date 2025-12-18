import { FileUploadService } from '../../services/uploads/FileUploadService';
import type { AuthContext } from '../../types';

export async function generateUploadUrlHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const fileUploadService = new FileUploadService(db, c.env);

  // Parse request body
  const body = await c.req.json();
  const { fileName, fileSize, mimeType, taskId, commentId } = body;

  // Validate required fields
  if (!fileName || !fileSize || !mimeType) {
    return c.json({ error: 'fileName, fileSize, and mimeType are required' }, 400);
  }

  // Call service layer (permission check is done inside the service)
  const result = await fileUploadService.generateUploadUrl(user.id, {
    fileName,
    fileSize,
    mimeType,
    taskId,
    commentId,
  });

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'FILE_TOO_LARGE' ? 413 :
                      result.code === 'INVALID_FILE_TYPE' ? 415 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json(result.data);
}
