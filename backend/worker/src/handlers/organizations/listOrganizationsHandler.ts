import { OrganizationQueryService } from '../../services/organizations/OrganizationQueryService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function listOrganizationsHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const organizationQueryService = new OrganizationQueryService(db, c.env);

  // Get pagination parameters from query string
  const page = c.req.query('page');
  const limit = c.req.query('limit');

  // Check if user is System Admin
  const isSystemAdmin = user?.systemRoleCode === 1;

  // Call service layer
  const result = await organizationQueryService.listOrganizations(
    { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 10 },
    user!.id,
    isSystemAdmin
  );

  if (!result.success) {
    return c.json({ 
      error: result.error,
      errorCode: ErrorCodes.ORGANIZATION_UPDATE_FAILED
    }, 500);
  }

  return c.json({
    organizations: result.data!.items,
    pagination: result.data!.pagination,
  });
}
