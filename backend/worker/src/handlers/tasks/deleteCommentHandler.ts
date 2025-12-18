import { TaskCommentService } from '../../services/tasks/TaskCommentService';
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
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ message: 'Comment deleted successfully' });
}
