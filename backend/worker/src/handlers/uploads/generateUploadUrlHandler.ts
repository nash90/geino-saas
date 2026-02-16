import { FileUploadService } from '../../services/uploads/FileUploadService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import { ErrorCodes } from '../../constants/errorCodes';
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
    return c.json({ 
      error: 'fileName, fileSize, and mimeType are required',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  // Validate that either taskId or commentId is provided
  if (!taskId && !commentId) {
    return c.json({ 
      error: 'Either taskId or commentId must be provided',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  // Get project ID for permission check
  const projectIdResult = await fileUploadService.getProjectIdFromContext(taskId, commentId);
  if (!projectIdResult.success) {
    const statusCode = projectIdResult.code === 'NOT_FOUND' ? 404 : 500;
    const errorCode = projectIdResult.code === 'NOT_FOUND' ? ErrorCodes.TASK_NOT_FOUND : undefined;
    return c.json({ error: projectIdResult.error, errorCode }, statusCode);
  }

  const projectId = projectIdResult.data!;

  // Check if user can view tasks in this project
  const canAccess = await AuthorizationService.canViewTask(db, user, projectId);
  if (!canAccess) {
    return c.json({ 
      error: 'You do not have access to this task',
      errorCode: ErrorCodes.NO_TASK_ACCESS
    }, 403);
  }

  // Call service layer for business logic
  const result = await fileUploadService.generateUploadUrl({
    fileName,
    fileSize,
    mimeType,
    taskId,
    commentId,
  });

  if (!result.success) {
    let errorCode;
    const statusCode =
      result.code === 'FILE_TOO_LARGE' ? 413 :
      result.code === 'INVALID_FILE_TYPE' ? 415 :
      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'FILE_TOO_LARGE') {
      errorCode = ErrorCodes.FILE_TOO_LARGE;
    } else if (result.code === 'INVALID_FILE_TYPE') {
      errorCode = ErrorCodes.INVALID_FILE_TYPE;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    } else {
      errorCode = ErrorCodes.FILE_UPLOAD_FAILED;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json(result.data);
}
