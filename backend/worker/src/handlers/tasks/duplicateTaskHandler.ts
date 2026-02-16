import { TaskCommandService } from '../../services/tasks/TaskCommandService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';
import { ErrorCodes } from '../../constants/errorCodes';

export async function duplicateTaskHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskCommandService = new TaskCommandService(db, c.env);

  // Get task ID from path parameter
  const taskId = c.req.param('taskId');

  // Get the original task to check project
  const task = await db.query.tasks.findFirst({
    where: (tasks, { eq }) => eq(tasks.id, taskId),
  });

  if (!task) {
    return c.json({ 
      error: 'Task not found',
      errorCode: ErrorCodes.TASK_NOT_FOUND 
    }, 404);
  }

  // Check if user has permission to create tasks in this project
  const hasAccess = await AuthorizationService.canCreateTask(db, user, task.projectId, task.statusCode);

  if (!hasAccess) {
    return c.json({ 
      error: 'Forbidden: You do not have permission to create tasks in this project',
      errorCode: ErrorCodes.NO_TASK_CREATE 
    }, 403);
  }

  // Get user's project role
  const projectMember = await db.query.projectMembers.findFirst({
    where: (projectMembers, { and, eq }) => and(
      eq(projectMembers.projectId, task.projectId),
      eq(projectMembers.userId, user.id)
    ),
  });

  const userRoleCode = projectMember?.projectRoleCode || 0;

  // Call service layer
  const result = await taskCommandService.duplicateTask(taskId, user.id, userRoleCode);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    message: 'Task duplicated successfully',
    task: result.data,
  }, 201);
}
