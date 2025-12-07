import { TaskQueryService } from '../../services/tasks/TaskQueryService';
import type { AuthContext } from '../../types';

export async function getTaskHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskQueryService = new TaskQueryService(db, c.env);

  // Get task ID from path parameter
  const taskId = c.req.param('taskId');

  // Call service layer (permission check is done inside the service)
  const result = await taskQueryService.getTaskById(taskId, user.id);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json(result.data);
}
