import { OrganizationMemberService } from '../../services/organizations/OrganizationMemberService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function addMemberHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const organizationMemberService = new OrganizationMemberService(db, c.env);

  // Get organization ID from URL params
  const organizationId = c.req.param('id');

  // Parse request body
  const body = await c.req.json();
  const { userId, organizationRoleCode } = body;

  // Call service layer
  const result = await organizationMemberService.addMember(
    organizationId,
    {
      userId,
      organizationRoleCode: organizationRoleCode || 1, // Default to organization_manager
    },
    user.id
  );

  if (!result.success) {
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'ALREADY_EXISTS' ? 409 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.ORGANIZATION_NOT_FOUND;
    } else if (result.code === 'ALREADY_EXISTS') {
      errorCode = ErrorCodes.ALREADY_EXISTS;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    } else {
      errorCode = ErrorCodes.MEMBER_ADD_FAILED;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({
    message: 'Member added successfully',
    member: result.data,
  }, 201);
}
