import { OrganizationQueryService } from '../../services/organizations/OrganizationQueryService';
import type { AuthContext } from '../../types';

export async function getOrganizationHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const organizationQueryService = new OrganizationQueryService(db, c.env);

  // Get organization ID from URL params
  const organizationId = c.req.param('id');

  // Check if user is System Admin
  const isSystemAdmin = user?.systemRoleCode === 1;

  // Call service layer
  const result = await organizationQueryService.getOrganizationById(
    organizationId,
    user!.id,
    isSystemAdmin
  );

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ organization: result.data });
}
