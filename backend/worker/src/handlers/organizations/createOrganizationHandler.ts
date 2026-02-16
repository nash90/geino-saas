import { OrganizationCreateService } from '../../services/organizations/OrganizationCreateService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function createOrganizationHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const organizationCreateService = new OrganizationCreateService(db, c.env);

  // Parse request body
  const body = await c.req.json();
  const { name, description, managerIds } = body;

  // Call service layer
  const result = await organizationCreateService.createOrganization(
    { name, description, managerIds },
    user!.id
  );

  if (!result.success) {
    const statusCode = result.code === 'INVALID_INPUT' ? 400 : 500;
    const errorCode = result.code === 'INVALID_INPUT' ? ErrorCodes.INVALID_INPUT : ErrorCodes.ORGANIZATION_CREATE_FAILED;
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({
    message: 'Organization created successfully',
    organization: result.data,
  }, 201);
}
