import { OrganizationUpdateService } from '../../services/organizations/OrganizationUpdateService';
import { ErrorCodes } from '../../constants/errorCodes';
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
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.ORGANIZATION_NOT_FOUND;
    } else if (result.code === 'FORBIDDEN') {
      errorCode = ErrorCodes.NO_ORGANIZATION_MANAGE;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    } else {
      errorCode = ErrorCodes.ORGANIZATION_UPDATE_FAILED;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({
    message: 'Organization updated successfully',
    organization: result.data,
  });
}
