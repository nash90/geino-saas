import { TaskCommentService } from '../../services/tasks/TaskCommentService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function deleteCommentHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskCommentService = new TaskCommentService(db, c.env);

  // Get comment ID from path parameter
  const commentId = c.req.param('commentId');

  // Call service layer (permission check is done inside the service - owner or PM+)
  const result = await taskCommentService.deleteComment(commentId, user.id);

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

  return c.json({ message: 'Comment deleted successfully' });
}
