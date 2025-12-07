import { TaskCommentService } from '../../services/tasks/TaskCommentService';
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
    return c.json({ error: 'Comment content is required' }, 400);
  }

  // Call service layer (permission check is done inside the service - owner only)
  const result = await taskCommentService.updateComment(commentId, user.id, content);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    message: 'Comment updated successfully',
    comment: result.data,
  });
}
