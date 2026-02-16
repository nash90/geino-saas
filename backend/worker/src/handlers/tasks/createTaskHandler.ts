import { TaskCommandService } from '../../services/tasks/TaskCommandService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import { DateValidationService } from '../../services/validation/DateValidationService';
import type { AuthContext } from '../../types';
import { ErrorCodes } from '../../constants/errorCodes';

export async function createTaskHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const taskCommandService = new TaskCommandService(db, c.env);
  const dateValidator = new DateValidationService();

  // Get project ID from path parameter
  const projectId = c.req.param('projectId');

  // Parse request body
  const body = await c.req.json();
  const { title, description, statusCode, typeCode, priorityCode, assignedTo, deadline } = body;

  // Validate deadline ISO string format if provided
  if (deadline) {
    const isoValidation = dateValidator.validateISODateString(deadline, 'deadline');
    if (isoValidation) {
      return c.json({ error: isoValidation.error }, 400);
    }
  }

  // Check if user has permission to create tasks
  const hasAccess = await AuthorizationService.canCreateTask(db, user, projectId, statusCode);

  if (!hasAccess) {
    return c.json({ 
      error: 'Forbidden: You do not have permission to create tasks in this project',
      errorCode: ErrorCodes.NO_TASK_CREATE 
    }, 403);
  }

  // Get user's project role for validation
  const projectMember = await db.query.projectMembers.findFirst({
    where: (projectMembers, { and, eq }) => and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, user.id)
    ),
  });

  const userRoleCode = projectMember?.projectRoleCode || 0;

  // Call service layer
  const result = await taskCommandService.createTask(
    {
      projectId,
      title,
      description,
      statusCode,
      typeCode,
      priorityCode,
      assignedTo,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: user.id,
    },
    userRoleCode
  );

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    message: 'Task created successfully',
    task: result.data,
  }, 201);
}
