import { ProjectCommandService } from '../../services/projects/ProjectCommandService';
import { isOrganizationManagerOrAbove } from '../../middleware/auth';
import type { AuthContext, OptionalAuthContext } from '../../types';

export async function createProjectHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const projectCommandService = new ProjectCommandService(db, c.env);

  // Parse request body
  const body = await c.req.json();
  const { organizationId, name, description, startDate, endDate, members } = body;

  // Check if user has permission (System Admin or Organization Manager)
  // @ts-ignore - AuthContext to OptionalAuthContext type mismatch, but user is guaranteed by auth middleware
  const hasAccess = await isOrganizationManagerOrAbove(c, body.organizationId);

  if (!hasAccess) {
    return c.json({ error: 'Forbidden: You do not have permission to create projects in this organization' }, 403);
  }

  // Call service layer
  const result = await projectCommandService.createProject({
    organizationId,
    name,
    description,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    createdBy: user!.id,
    members,
  });

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    message: 'Project created successfully',
    project: result.data,
  }, 201);
}
