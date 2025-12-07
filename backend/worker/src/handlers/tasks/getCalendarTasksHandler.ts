import { TaskQueryService } from '../../services/tasks/TaskQueryService';
import type { AuthContext } from '../../types';

export async function getCalendarTasksHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskQueryService = new TaskQueryService(db, c.env);

  // Get query parameters
  const projectIdsParam = c.req.query('projectIds');
  const fromDate = c.req.query('fromDate');
  const toDate = c.req.query('toDate');

  // Validate required parameters
  if (!projectIdsParam || !fromDate || !toDate) {
    return c.json({ error: 'projectIds, fromDate, and toDate are required' }, 400);
  }

  // Parse project IDs (expecting comma-separated string)
  const projectIds = projectIdsParam.split(',').filter(id => id.trim());

  if (projectIds.length === 0) {
    return c.json({ error: 'At least one project ID is required' }, 400);
  }

  // Call service layer (permission check is done inside the service)
  const result = await taskQueryService.getTasksForCalendar(
    projectIds,
    user.id,
    new Date(fromDate),
    new Date(toDate)
  );

  if (!result.success) {
    const statusCode = result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ calendarTasks: result.data });
}
