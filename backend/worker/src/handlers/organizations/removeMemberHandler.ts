import { OrganizationMemberService } from '../../services/organizations/OrganizationMemberService';
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
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'INVALID_INPUT' ? 400 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ message: 'Member removed successfully' });
}
