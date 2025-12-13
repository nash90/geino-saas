import { FileUploadService } from '../../services/uploads/FileUploadService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import { tasks, taskComments } from '../../db/schema';
import { eq } from 'drizzle-orm';
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

  // Validate that either taskId or commentId is provided
  if (!taskId && !commentId) {
    return c.json({ error: 'Either taskId or commentId must be provided' }, 400);
  }

  // Permission check at handler level
  let projectId: string;

  if (taskId) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    projectId = task.projectId;
  } else {
    const comment = await db.query.taskComments.findFirst({
      where: eq(taskComments.id, commentId!),
    });

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, comment.taskId),
    });

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    projectId = task.projectId;
  }

  // Check if user can view tasks in this project
  const canAccess = await AuthorizationService.canViewTask(db, user, projectId);
  if (!canAccess) {
    return c.json({ error: 'You do not have access to this task' }, 403);
  }

  // Call service layer
  const result = await fileUploadService.generateUploadUrl({
    fileName,
    fileSize,
    mimeType,
    taskId,
    commentId,
  });

  if (!result.success) {
    const statusCode = result.code === 'FILE_TOO_LARGE' ? 413 :
                      result.code === 'INVALID_FILE_TYPE' ? 415 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json(result.data);
}
