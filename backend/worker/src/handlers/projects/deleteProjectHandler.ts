import { ProjectCommandService } from '../../services/projects/ProjectCommandService';
import { ProjectQueryService } from '../../services/projects/ProjectQueryService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';
import { ErrorCodes } from '../../constants/errorCodes';

export async function deleteProjectHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const projectCommandService = new ProjectCommandService(db, c.env);
  const projectQueryService = new ProjectQueryService(db, c.env);

  // Get project ID from URL params
  const projectId = c.req.param('id');

  // Get project to check organization
  const projectResult = await projectQueryService.getProjectById(projectId);

  if (!projectResult.success) {
    const statusCode = projectResult.code === 'NOT_FOUND' ? 404 : 500;
    return c.json({ error: projectResult.error }, statusCode);
  }

  const project = projectResult.data!;

  // Check if user has permission (System Admin or Organization Manager)
  const hasAccess = await AuthorizationService.isOrganizationManagerOrAbove(db, user, project.organizationId);

  if (!hasAccess) {
    return c.json({ 
      error: 'Forbidden: Only Organization Managers can delete projects',
      errorCode: ErrorCodes.NO_PROJECT_DELETE 
    }, 403);
  }

  // Call service layer
  const result = await projectCommandService.deleteProject(projectId);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ message: 'Project deleted successfully' });
}
