import { ProjectQueryService } from '../../services/projects/ProjectQueryService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';
import { Profiler } from '../../lib/profiler';

export async function getProjectHandler(c: AuthContext) {
  const profiler = c.get('profiler');

  const db = c.get('db');
  const user = c.get('user');
  const projectQueryService = new ProjectQueryService(db, c.env);
  const projectId = c.req.param('id');
  profiler.checkpoint('Handler setup');

  // Call service layer
  const result = await projectQueryService.getProjectById(projectId);
  profiler.checkpoint('getProjectById query');

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
    profiler.checkpoint('Authorization check');

    // Also check if user is any kind of project member (not just manager)
    if (!hasAccess) {
      const isMember = project.members.some(m => m.userId === user!.id);
      if (!isMember) {
        return c.json({ error: 'Forbidden: You do not have access to this project' }, 403);
      }
    }
  } else {
    profiler.checkpoint('Authorization (skip - admin)');
  }

  return c.json({ project });
}
