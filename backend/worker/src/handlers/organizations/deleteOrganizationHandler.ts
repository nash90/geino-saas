import { OrganizationDeleteService } from '../../services/organizations/OrganizationDeleteService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function deleteOrganizationHandler(c: AuthContext) {
  const db = c.get('db');
  const organizationDeleteService = new OrganizationDeleteService(db, c.env);

  // Get organization ID from URL params
  const organizationId = c.req.param('id');

  // Call service layer
  const result = await organizationDeleteService.deleteOrganization(organizationId);

  if (!result.success) {
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.ORGANIZATION_NOT_FOUND;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    } else {
      errorCode = ErrorCodes.ORGANIZATION_DELETE_FAILED;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({ message: 'Organization deleted successfully' });
}
