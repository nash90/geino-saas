import { FileUploadService } from '../../services/uploads/FileUploadService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function confirmUploadHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const fileUploadService = new FileUploadService(db, c.env);

  // Parse request body
  const body = await c.req.json();
  const { uploadId, fileKey, fileName, fileSize, mimeType, taskId, commentId } = body;

  // Validate required fields
  if (!uploadId || !fileKey || !fileName || !fileSize || !mimeType) {
    return c.json({ 
      error: 'uploadId, fileKey, fileName, fileSize, and mimeType are required',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  // Call service layer
  const result = await fileUploadService.confirmUpload(
    user.id,
    uploadId,
    fileKey,
    fileName,
    fileSize,
    mimeType,
    taskId,
    commentId
  );

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 500;
    const errorCode = result.code === 'NOT_FOUND' ? ErrorCodes.TASK_NOT_FOUND : ErrorCodes.FILE_UPLOAD_FAILED;
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({
    message: 'Upload confirmed successfully',
    attachment: result.data,
  }, 201);
}
