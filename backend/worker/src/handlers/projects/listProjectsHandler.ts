import { ProjectQueryService } from '../../services/projects/ProjectQueryService';
import type { AuthContext } from '../../types';

export async function listProjectsHandler(c: AuthContext) {
  const profiler = c.get('profiler');
  const db = c.get('db');
  const user = c.get('user');
  const projectQueryService = new ProjectQueryService(db, c.env);

  // Get pagination and filter parameters
  const page = c.req.query('page');
  const limit = c.req.query('limit');
  const organizationId = c.req.query('organizationId');
  profiler.checkpoint('Handler setup');

  // Check if user is System Admin
  const isSystemAdmin = user?.systemRoleCode === 1;

  // Call service layer
  const result = await projectQueryService.listProjects(
    { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 10 },
    user!.id,
    isSystemAdmin,
    organizationId
  );
  profiler.checkpoint('listProjects query');

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({
    projects: result.data!.items,
    pagination: result.data!.pagination,
  });
}
