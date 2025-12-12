import { ProjectQueryService } from '../../services/projects/ProjectQueryService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';

export async function getProjectHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const projectQueryService = new ProjectQueryService(db, c.env);

  // Get project ID from URL params
  const projectId = c.req.param('id');

  // Call service layer
  const result = await projectQueryService.getProjectById(projectId);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  const project = result.data!;

  // Check if user has access to view this project
  const isSystemAdmin = user.systemRoleCode === 1;
  
  if (!isSystemAdmin) {
    // Check if user is org manager or project member
    const hasAccess = await AuthorizationService.isProjectManagerOrAbove(db, user, projectId);
    
    // Also check if user is any kind of project member (not just manager)
    if (!hasAccess) {
      const isMember = project.members.some(m => m.userId === user!.id);
      if (!isMember) {
        return c.json({ error: 'Forbidden: You do not have access to this project' }, 403);
      }
    }
  }

  return c.json({ project });
}
