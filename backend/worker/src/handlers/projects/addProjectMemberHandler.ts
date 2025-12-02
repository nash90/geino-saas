import { ProjectCommandService } from '../../services/projects/ProjectCommandService';
import { isProjectManagerOrAbove } from '../../middleware/auth';
import type { AuthContext, OptionalAuthContext } from '../../types';

export async function addProjectMemberHandler(c: AuthContext) {
  const db = c.get('db');
  const projectCommandService = new ProjectCommandService(db, c.env);

  // Get project ID from URL params
  const projectId = c.req.param('id');

  // Check if user has permission (System Admin, Org Manager, or Project Manager)
  // @ts-ignore - AuthContext to OptionalAuthContext type mismatch, but user is guaranteed by auth middleware
  const hasAccess = await isProjectManagerOrAbove(c, projectId);

  if (!hasAccess) {
    return c.json({ error: 'Forbidden: You do not have permission to manage this project' }, 403);
  }

  // Parse request body
  const body = await c.req.json();
  const { userId, projectRoleCode } = body;

  // Call service layer
  const result = await projectCommandService.addMember(projectId, userId, projectRoleCode);

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
