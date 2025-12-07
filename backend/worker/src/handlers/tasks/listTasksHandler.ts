import { TaskQueryService } from '../../services/tasks/TaskQueryService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';

export async function listTasksHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskQueryService = new TaskQueryService(db, c.env);

  // Get project ID from path parameter
  const projectId = c.req.param('projectId');

  // Get pagination and filter parameters
  const page = c.req.query('page');
  const limit = c.req.query('limit');
  const statusCode = c.req.query('statusCode');
  const assignedTo = c.req.query('assignedTo');
  const fromDate = c.req.query('fromDate');
  const toDate = c.req.query('toDate');

  // Check if user has permission to view tasks in this project
  const hasAccess = await AuthorizationService.canViewTask(db, user, projectId);

  if (!hasAccess) {
    return c.json({ error: 'Forbidden: You do not have access to this project' }, 403);
  }

  // Call service layer
  const result = await taskQueryService.listTasks(projectId, user.id, {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    statusCode: statusCode ? parseInt(statusCode) : undefined,
    assignedTo: assignedTo || undefined,
    fromDate: fromDate ? new Date(fromDate) : undefined,
    toDate: toDate ? new Date(toDate) : undefined,
  });

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    tasks: result.data!.items,
    pagination: result.data!.pagination,
  });
}
