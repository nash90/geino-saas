import { OrganizationUpdateService } from '../../services/organizations/OrganizationUpdateService';
import type { AuthContext } from '../../types';

export async function updateOrganizationHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const organizationUpdateService = new OrganizationUpdateService(db, c.env);

  // Get organization ID from URL params
  const organizationId = c.req.param('id');

  // Parse request body
  const body = await c.req.json();
  const { name, description } = body;

  // Check if user is System Admin
  const isSystemAdmin = user?.systemRoleCode === 1;

  // Call service layer
  const result = await organizationUpdateService.updateOrganization(
    organizationId,
    { name, description },
    user!.id,
    isSystemAdmin
  );

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({
    message: 'Organization updated successfully',
    organization: result.data,
  });
}
