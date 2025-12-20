import { TaskCommentService } from '../../services/tasks/TaskCommentService';
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
    return c.json({ error: 'Comment content is required' }, 400);
  }

  // Call service layer (permission check is done inside the service)
  const result = await taskCommentService.addComment(
    taskId,
    user.id,
    content,
    attachmentIds
  );

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    message: 'Comment added successfully',
    comment: result.data,
  }, 201);
}
