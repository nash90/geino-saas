import { ProjectCommandService } from '../../services/projects/ProjectCommandService';
import { ProjectQueryService } from '../../services/projects/ProjectQueryService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';

export async function updateProjectHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const projectCommandService = new ProjectCommandService(db, c.env);
  const projectQueryService = new ProjectQueryService(db, c.env);

  // Get project ID from URL params
  const projectId = c.req.param('id');

  // Check if user has permission (System Admin, Org Manager, or Project Manager)
  const hasAccess = await AuthorizationService.isProjectManagerOrAbove(db, user, projectId);

  if (!hasAccess) {
    return c.json({ error: 'Forbidden: You do not have permission to update this project' }, 403);
  }

  // Parse request body
  const body = await c.req.json();
  const { name, description, startDate, endDate, statusCode } = body;

  // Call service layer
  const result = await projectCommandService.updateProject(projectId, {
    name,
    description,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    statusCode,
  });

  if (!result.success) {
    const status = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, status);
  }

  return c.json({ message: 'Project updated successfully' });
}
