import { TaskCommandService } from '../../services/tasks/TaskCommandService';
import type { AuthContext } from '../../types';

export async function deleteTaskHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskCommandService = new TaskCommandService(db, c.env);

  // Get task ID from path parameter
  const taskId = c.req.param('taskId');

  // Call service layer (permission check is done inside the service - PM+ only)
  const result = await taskCommandService.deleteTask(taskId, user.id);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ message: 'Task deleted successfully' });
}
