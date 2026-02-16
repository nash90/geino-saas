import { TaskCommentService } from '../../services/tasks/TaskCommentService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function addCommentHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskCommentService = new TaskCommentService(db, c.env);

  // Get task ID from path parameter
  const taskId = c.req.param('taskId');

  // Parse request body
  const body = await c.req.json();
  const { content, attachmentIds } = body;

  if (!content) {
    return c.json({ 
      error: 'Comment content is required',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  // Call service layer (permission check is done inside the service)
  const result = await taskCommentService.addComment(
    taskId,
    user.id,
    content,
    attachmentIds
  );

  if (!result.success) {
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.TASK_NOT_FOUND;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({
    message: 'Comment added successfully',
    comment: result.data,
  }, 201);
}
