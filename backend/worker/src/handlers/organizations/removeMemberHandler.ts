import { OrganizationMemberService } from '../../services/organizations/OrganizationMemberService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function removeMemberHandler(c: AuthContext) {
  const db = c.get('db');
  const organizationMemberService = new OrganizationMemberService(db, c.env);

  // Get organization ID and user ID from URL params
  const organizationId = c.req.param('id');
  const userId = c.req.param('userId');

  // Call service layer
  const result = await organizationMemberService.removeMember(organizationId, userId);

  if (!result.success) {
    let errorCode;
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    
    if (result.code === 'NOT_FOUND') {
      errorCode = ErrorCodes.USER_NOT_FOUND;
    } else if (result.code === 'INVALID_INPUT') {
      errorCode = ErrorCodes.INVALID_INPUT;
    } else {
      errorCode = ErrorCodes.MEMBER_REMOVE_FAILED;
    }
    
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({ message: 'Member removed successfully' });
}
