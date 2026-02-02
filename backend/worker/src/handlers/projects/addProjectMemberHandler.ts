import { ProjectCommandService } from '../../services/projects/ProjectCommandService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';

export async function addProjectMemberHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const projectCommandService = new ProjectCommandService(db, c.env);

  // Get project ID from URL params
  const projectId = c.req.param('id');

  // Check if user has permission (System Admin, Org Manager, or Project Manager)
  const hasAccess = await AuthorizationService.isProjectManagerOrAbove(db, user, projectId);

  if (!hasAccess) {
    return c.json({ error: 'Forbidden: You do not have permission to manage this project' }, 403);
  }

  // Parse request body
  const body = await c.req.json();
  const { userId, projectRoleCode } = body;

  // Call service layer
  const result = await projectCommandService.addMember(projectId, userId, projectRoleCode, user.id);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'ALREADY_EXISTS' ? 409 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    message: 'Member added successfully',
    member: result.data,
  }, 201);
}
