import { TaskCommandService } from '../../services/tasks/TaskCommandService';
import { ErrorCodes } from '../../constants/errorCodes';
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
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.TASK_NOT_FOUND;
    } else if (result.code === 'FORBIDDEN') {
      errorCode = ErrorCodes.NO_TASK_DELETE;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    } else {
      errorCode = ErrorCodes.TASK_DELETE_FAILED;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({ message: 'Task deleted successfully' });
}
