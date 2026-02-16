import { TaskCommentService } from '../../services/tasks/TaskCommentService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function updateCommentHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskCommentService = new TaskCommentService(db, c.env);

  // Get comment ID from path parameter
  const commentId = c.req.param('commentId');

  // Parse request body
  const body = await c.req.json();
  const { content } = body;

  if (!content) {
    return c.json({ 
      error: 'Comment content is required',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  // Call service layer (permission check is done inside the service - owner only)
  const result = await taskCommentService.updateComment(commentId, user.id, content);

  if (!result.success) {
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.COMMENT_NOT_FOUND;
    } else if (result.code === 'FORBIDDEN') {
      errorCode = ErrorCodes.NO_TASK_ACCESS;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({
    message: 'Comment updated successfully',
    comment: result.data,
  });
}
