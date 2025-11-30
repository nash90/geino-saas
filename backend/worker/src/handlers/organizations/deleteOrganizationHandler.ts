import { OrganizationDeleteService } from '../../services/organizations/OrganizationDeleteService';
import type { AuthContext } from '../../types';

export async function deleteOrganizationHandler(c: AuthContext) {
  const db = c.get('db');
  const organizationDeleteService = new OrganizationDeleteService(db, c.env);

  // Get organization ID from URL params
  const organizationId = c.req.param('id');

  // Call service layer
  const result = await organizationDeleteService.deleteOrganization(organizationId);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ message: 'Organization deleted successfully' });
}
