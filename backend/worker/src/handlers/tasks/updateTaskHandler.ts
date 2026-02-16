import { TaskCommandService } from '../../services/tasks/TaskCommandService';
import { DateValidationService } from '../../services/validation/DateValidationService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function updateTaskHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskCommandService = new TaskCommandService(db, c.env);
  const dateValidator = new DateValidationService();

  // Get task ID from path parameter
  const taskId = c.req.param('taskId');

  // Parse request body
  const body = await c.req.json();
  const { title, description, statusCode, typeCode, priorityCode, assignedTo, deadline } = body;

  // Validate deadline ISO string format if provided
  if (deadline) {
    const isoValidation = dateValidator.validateISODateString(deadline, 'deadline');
    if (isoValidation) {
      return c.json({ 
        error: isoValidation.error,
        errorCode: ErrorCodes.INVALID_INPUT
      }, 400);
    }
  }

  // Call service layer (permission check is done inside the service)
  const result = await taskCommandService.updateTask(
    taskId,
    {
      title,
      description,
      statusCode,
      typeCode,
      priorityCode,
      assignedTo,
      deadline: deadline ? new Date(deadline) : null,
    },
    user.id
  );

  if (!result.success) {
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.TASK_NOT_FOUND;
    } else if (result.code === 'FORBIDDEN') {
      errorCode = ErrorCodes.NO_TASK_EDIT;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    } else {
      errorCode = ErrorCodes.TASK_UPDATE_FAILED;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({
    message: 'Task updated successfully',
    task: result.data,
  });
}
