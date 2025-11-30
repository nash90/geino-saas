import { authenticate } from '../../middleware/auth';
import type { OptionalAuthContext } from '../../types';

export async function sessionHandler(c: OptionalAuthContext) {
  try {
    const user = await authenticate(c);
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        systemRoleCode: user.systemRoleCode,
      },
      organizations: [], // TODO: Fetch from organization_members
      projects: [], // TODO: Fetch from project_members
    });
  } catch (error) {
    console.error('[Session Error]', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
}
