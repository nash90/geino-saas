import { TaskQueryService } from '../../services/tasks/TaskQueryService';
import { ErrorCodes } from '../../constants/errorCodes';
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
    return c.json({ 
      error: 'projectIds, fromDate, and toDate are required',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  // Parse project IDs (expecting comma-separated string)
  const projectIds = projectIdsParam.split(',').filter(id => id.trim());

  if (projectIds.length === 0) {
    return c.json({ 
      error: 'At least one project ID is required',
      errorCode: ErrorCodes.MISSING_REQUIRED_FIELD
    }, 400);
  }

  // Call service layer (permission check is done inside the service)
  const result = await taskQueryService.getTasksForCalendar(
    projectIds,
    user.id,
    new Date(fromDate),
    new Date(toDate)
  );

  if (!result.success) {
    let errorCode;
    const statusCode = result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'FORBIDDEN') {
      errorCode = ErrorCodes.NO_PROJECT_ACCESS;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({ calendarTasks: result.data });
}
